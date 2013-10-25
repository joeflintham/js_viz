#!/usr/bin/python

import csv, re, json, sys, os, traceback

# globals
errors = {}
removedIndeces = {}

rno = 8 #can be overwritten with the setResultSize method

def catchError():
    etype, value, tb = sys.exc_info()
    print str(etype) + " - " + str(value) + " - " + str(dir(tb)) + str(tb.tb_lineno)
    # if you see a bunch of code, error messages and angle brackets, show them to a pythonist

def generateIndex(f):
    _index = {}
    with open(f,'rb') as indexfile:
        indexreader = csv.reader(indexfile)
        for row in indexreader:
            # we have a reference item if there is a value in the first two columns.
            if row[0] and row[1]:
                code = row[0]
                name = row[1]
                _index[code] = { 'name': name }

    print 'created index'
    return _index
                    
def parseData(f, _index):
    data = {}
    with open(f,'rb') as csvfile:
        reader = csv.reader(csvfile)
        try:
            for row in reader:
                # the lines with actual data begin with a two letter code
                r = re.compile('\w{2}$')
                if r.match(row[0]):
                    code = row[0] # the first column is the sector code 
                    total = row[1] # the second column is a total of the other cells in the row
                    if total == '': total = 0

                    s = 0 # s keeps an accumulative tally of the sector total 
                    counter = 2 # individual matrix figures start in column 3
                    intList = [] 
                    
                    # turns a row of cell values into an array
                    for n in row[2:]:
                        try:
                            n = int(n)
                        except ValueError:
                            n = 0 # catch empty or non-numerical values 
                            row[counter] = '0'
                        s += n # running total
                        counter += 1
                        intList.append(n)

                    # check the accumulative total matches the one reported in the source file
                    print total
                    if s == int(total):
                        print 'figures tally for ' + str(code) + ', ' + str(s) + ' == ' + str(total)
                    else:
                        errors[code] = 'figures don\'t tally for ' + str(code) + ', ' + str(s) + ' != ' + str(total) + '; this dataset is dirty :-('
                        print errors[code]
                    if code not in _index:
                        _index[code] = {}
                        _index[code]['name'] = 'Untitled'
                    _index[code]['total'] = s
                    
                    data[code] = intList # matrix data with code key   
        except:
            catchError()

    print 'processed source matrix data'
    keysToRemove = []
    for key in _index:
        if key not in data:
            keysToRemove.append(key)
    for a in keysToRemove:
        removedIndeces[a] = _index[a]
        del _index[a]
    return data, _index

def setResultSize(newrno):
    rno = newrno

def getTopByVolume(no, ix):
    try:
        # creates an array of alphabetically sorted key from the index
        sI = sorted(ix)
        # get the top n by total from the index
        sD = sorted(sI, key=lambda x: int(ix[x]['total']), reverse=True)[:no]
        
        pL = [] # used to get the positions of the top n sectors within the matrix
        iO = {} # a new index with only the sectors of interest included
        for a in sD:
            iO[a] = ix[a]
            for i, v in enumerate(sI):
                if a == v:
                    pL.append(i)
    except:
        catchError()
                    
    return sI, sD, pL, iO

def prepareTreeData(_index, data):
    try:
        
        sortedIndex, sortedData, posList, indexOutput = getTopByVolume(rno, _index)
                    
        #tree map output
        treeData = []
        for a in sorted(sortedData):
            tmpd = []
            acc = 0;
            for b in sorted(posList):
                name = _index[sortedIndex[b]]['name']
                val = data[a][b]
                acc = acc + val
                tmpd.append({'name': name, 'size': val, 'code': sortedIndex[b]})
            indexOutput[a]['total'] = acc
            treeData.append({'name': _index[a]['name'], 'children': tmpd, 'code': a})
                
        output = { 'index': indexOutput, 'data': {'name': 'Candidate sector destinations', 'children': treeData}, 'errors': errors }
        print 'generated tree map output'
        return output

    except:
        catchError()


def prepareChordData(_index, data):
    try:
        
        sortedIndex, sortedData, posList, indexOutput = getTopByVolume(rno, _index)

        #chord diagram output
        chordData = []
        for a in sorted(sortedData):
            tmpd = []
            acc = 0
            for b in sorted(posList):
                val = data[a][b]
                tmpd.append(val)
                acc = acc + val
            indexOutput[a]['total'] = acc
            chordData.append({a: tmpd})
                
        output = { 'index': indexOutput, 'data': chordData, 'errors': errors }
        print 'generated chord diagram output'
        return output

    except:
        catchError()
            

def writeOutput(f, data):
    try:
        fw = open(f,'w')
        fw.write(json.dumps(data))
        print 'wrote file ' + str(f)
    except:
        catchError()


