#!/usr/bin/env python3
"""Validate lingua-arena unit data.

Usage:  python3 tools/validate.py            (run from the repo root)

Hard errors (exit code 1): missing fields, bad answer indexes, empty answers,
unit files that are not parallel across languages.
Warnings: pinyin / kana readings that differ from an automatic conversion
(only if the optional libraries pypinyin / pykakasi are installed).
"""
import glob
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CATS = ['vocab', 'grammar', 'listening', 'reading', 'speaking', 'writing']
FORMATS_L = {'qr', 'conv', 'talk', 'form'}
FORMATS_R = {'incomplete', 'textcomp', 'short', 'tfng'}

errors, warns = [], []


def err(path, msg):
    errors.append(f'{path}: {msg}')


def warn(path, msg):
    warns.append(f'{path}: {msg}')


def check_question(p, q):
    t = q.get('type')
    if not q.get('q'):
        err(p, 'question without text')
    if t in ('mc', 'tfng'):
        opts = q.get('options')
        if not isinstance(opts, list) or len(opts) < 2:
            err(p, 'options missing')
            return
        if len(set(opts)) != len(opts):
            err(p, f'duplicate options {opts}')
        a = q.get('answer')
        if not isinstance(a, int) or not 0 <= a < len(opts):
            err(p, f'answer index out of range: {a}')
        if t == 'tfng' and len(opts) != 3:
            err(p, 'tfng needs exactly 3 options')
    elif t == 'blank':
        ans = q.get('answers')
        if not ans or not all(isinstance(x, str) and x.strip() for x in ans):
            err(p, 'blank without answers')
    else:
        err(p, f'unknown question type {t}')


def signature(d):
    """Structure fingerprint used to check that all languages are parallel."""
    return {
        'vocab': len(d['vocab']),
        'grammar.rows': len(d['grammar']['table']['rows']) if d['lang'] == 'x' else None,
        'grammar.examples': len(d['grammar']['examples']),
        'grammar.practice': len(d['grammar']['practice']),
        'listening': [(i['id'], i['format'], len(i['questions'])) for i in d['listening']['items']],
        'reading': [(i['id'], i['format'], len(i['questions'])) for i in d['reading']['items']],
        'speaking': len(d['speaking']['expressions']),
        'writing': len(d['writing']['expressions']),
    }


def main():
    files = sorted(glob.glob(os.path.join(ROOT, 'data', '*', '*', 'u*.json')))
    if not files:
        print('no unit files found')
        return 1
    by_unit = {}
    try:
        from pypinyin import lazy_pinyin
    except Exception:
        lazy_pinyin = None
    try:
        import pykakasi
        kks = pykakasi.kakasi()
    except Exception:
        kks = None

    for f in files:
        rel = os.path.relpath(f, ROOT)
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception as e:  # noqa
            err(rel, f'invalid JSON: {e}')
            continue
        m = d.get('meta', {})
        lang = m.get('lang')
        exp = os.path.normpath(f'data/{lang}/{m.get("level")}/u{int(m.get("unit", 0)):02d}.json')
        if os.path.normpath(rel) != exp:
            err(rel, f'path does not match meta (expected {exp})')
        for c in CATS:
            if c not in d:
                err(rel, f'missing category {c}')
        if any(c not in d for c in CATS):
            continue

        ids = []
        # vocab
        for v in d['vocab']:
            ids.append(v['id'])
            if not v.get('t') or not (v.get('ko') or v.get('en')):
                err(rel, f"vocab {v.get('id')} needs t and a gloss")
            if not v.get('ex', {}).get('t'):
                err(rel, f"vocab {v.get('id')} needs an example")
            if lang == 'zh' and lazy_pinyin and v.get('read'):
                auto = ''.join(lazy_pinyin(v['t'], style=0))
                mine = re.sub(r'[^a-z]', '', unicodedata.normalize('NFD', v['read']).lower().encode('ascii', 'ignore').decode())
                if auto != mine:
                    warn(rel, f"pinyin {v['t']}: written '{v['read']}' vs auto '{auto}'")
            if lang == 'ja' and kks and v.get('read'):
                auto = ''.join(x['hira'] for x in kks.convert(v['t']))
                if auto != v['read']:
                    warn(rel, f"kana {v['t']}: written '{v['read']}' vs auto '{auto}'")
        # grammar
        g = d['grammar']
        for k in ('explain', 'table', 'notes', 'examples', 'practice'):
            if k not in g:
                err(rel, f'grammar missing {k}')
        for p in g.get('practice', []):
            ids.append(p['id'])
            check_question(f'{rel} {p["id"]}', p)
            if p['q'].count('___') != 1:
                err(rel, f'{p["id"]}: practice needs exactly one ___')
        # listening / reading
        for cat, fmts in (('listening', FORMATS_L), ('reading', FORMATS_R)):
            for it in d[cat]['items']:
                ids.append(it['id'])
                if it['format'] not in fmts:
                    err(rel, f'{it["id"]}: unknown format {it["format"]}')
                if cat == 'listening':
                    lines = it.get('tts', {}).get('lines', [])
                    spk = {s['id'] for s in it.get('tts', {}).get('speakers', [])}
                    if not lines or any(l['s'] not in spk or not l['t'] for l in lines):
                        err(rel, f'{it["id"]}: bad tts lines/speakers')
                else:
                    if not it.get('passage'):
                        err(rel, f'{it["id"]}: missing passage')
                if not it.get('trans'):
                    err(rel, f'{it["id"]}: missing translation')
                for i, q in enumerate(it['questions']):
                    check_question(f'{rel} {it["id"]}.{i+1}', q)
        # blank answers must appear in the transcript (listening form items)
        for it in d['listening']['items']:
            text = ' '.join(l['t'] for l in it['tts']['lines']).lower()
            for q in it['questions']:
                if q['type'] == 'blank' and not any(a.lower() in text for a in q['answers']):
                    err(rel, f'{it["id"]}: blank answer not found in transcript: {q["answers"]}')
        # tfng: statement must be a single sentence, answer sanity
        # speaking / writing
        for s in d['speaking']['expressions']:
            ids.append(s['id'])
            if not s.get('t'):
                err(rel, f'{s["id"]}: empty expression')
        for w in d['writing']['expressions']:
            ids.append(w['id'])
        task = d['writing']['task']
        if not task['must_include'] or not task['model']:
            err(rel, 'writing task needs must_include and model')
        low = task['model'].lower().replace('’', "'")
        for mi in task['must_include']:
            if not any(x.lower() in low for x in mi['match']):
                err(rel, f'model answer does not satisfy must_include "{mi["label"]}"')
        if len(ids) != len(set(ids)):
            err(rel, 'duplicate ids inside file')
        by_unit.setdefault((m.get('level'), m.get('unit')), {})[lang] = (rel, signature({**d, 'lang': lang}))

    # parallel check
    for key, langs in by_unit.items():
        if len(langs) < 2:
            continue
        ref_lang = 'en' if 'en' in langs else sorted(langs)[0]
        ref = langs[ref_lang][1]
        for lg, (rel, sig) in langs.items():
            for k in ref:
                if k == 'grammar.rows':
                    continue
                if sig[k] != ref[k]:
                    err(rel, f'not parallel with {ref_lang}: {k} {sig[k]} != {ref[k]}')

    for w in warns:
        print('WARN ', w)
    for e in errors:
        print('ERROR', e)
    print(f'\n{len(files)} files, {len(errors)} errors, {len(warns)} warnings')
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
