#!/usr/bin/python

import sys, glob, os, re, traceback, csv_parser

datapath = 'csv/data/'
indexpath = 'csv/index/'
jsonpath = 'json/'

listing = glob.glob( os.path.join(datapath, '*.csv'))
files = []
for f in listing:
    isDir = os.path.isdir(f)
    if os.path.isdir(f):
        print 'skipping directory ' + f
    else:
        print 'grokking ' + f
        fh = re.sub(datapath, '', f)
        r = re.compile('data(.{0,})\.csv')
        m = r.match(str(fh))
        if m:
            handle = re.sub('[^A-Za-z0-9]+', ' ', m.group(1)).strip()
            if handle == '':
                handle = 'untitled'
            files.append({'file': fh, 'handle': handle})

if len(files) == 0:
    sys.exit('no data*.csv files found; nothing to do, so exiting')  

datasets = []
for i, a in enumerate(files):
    
    fileName = re.sub('\.csv', '', a['file'])
    indexfile = indexpath + 'index.csv'
    datafile = datapath + a['file']
    chordfile = jsonpath + 'chord/' + fileName + '.json'
    treefile = jsonpath + 'tree/' + fileName + '.json'
    
    try:
        i = csv_parser.generateIndex(indexfile)
        d, i = csv_parser.parseData(datafile, i)
        c = csv_parser.prepareChordData(i, d)
        o = csv_parser.writeOutput(chordfile, c)
        c = csv_parser.prepareTreeData(i, d)
        o = csv_parser.writeOutput(treefile, c)

        datasets.append({'handle': a['handle'], 'chord': chordfile, 'tree': treefile})

    except:
        csv_parser.catchError()
        print 'there was a problem generating json data for ' + a['file'] + '; skipping.' 

output = { 'datasets': datasets }

csv_parser.writeOutput('datasets.json', output)
