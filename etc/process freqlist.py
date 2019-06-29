#!python
import sys
import json


def replace_kata_with_hira(text):
    newtext = ""
    for c in text:
        codepoint = ord(c)
        if codepoint >= 0x30A0 and codepoint <= 0x30FF:
            codepoint -= (0x30A0 - 0x3040)
        newtext += chr(codepoint)
    return newtext


sys.stdout.reconfigure(encoding='utf-8')

reading_mapping = {}

def add_reading_mapping(reading, etc):
    if reading not in reading_mapping:
        reading_mapping[reading] = [etc]
    else:
        reading_mapping[reading] += [etc]

with open(sys.argv[1], "r", encoding='utf-8') as f:
    rank = 0
    for line in f:
        rank += 1
        fields = line.split("\t")
        freq = float(fields[0])
        lemma_spelling = fields[5].split("-")[0]
        lemma_reading = replace_kata_with_hira(fields[6])
        extra_fields = len(fields)-9
        extra_stuff = extra_fields//7
        add_reading_mapping(lemma_reading, [lemma_spelling, rank, freq])
        for i in range(extra_stuff):
            spelling = fields[9+i*7+1].split("-")[0]
            reading = fields[9+i*7+2]
            if reading == lemma_reading:
                add_reading_mapping(lemma_reading, [spelling, rank, freq])
        
print(json.dumps(reading_mapping, ensure_ascii=False, indent=0))