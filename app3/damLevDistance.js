module.exports = {
    single: function(word, letters){
        return edits1(word, letters);
    },

    double: function(word, letters){
        let e1 = edits1(word, letters);
        return edits2(e1, letters);
    }
}

function edits1(word, letters){
    let splits = []

    let i, split, l, r, j, c;

    for(i = 0; i < word.length + 1; i++){
        splits.push([word.substring(0, i), word.substring(i)])
    }

    let deletes = [];
    let transposes = [];
    let replaces = [];
    let inserts = [];

    for(i = 0; i < splits.length; i++){
        split = splits[i];
        l = split[0];
        r = split[1];

        if(r){
            deletes.push(l + r.substring(1));
        }

        if(r.length > 1){
            transposes.push(l + r[1] + r[0] + r.substring(2));
        }

        for(j = 0; j < letters.length; j++){
            c = letters[j];
            inserts.push(l + c + r);
            if(r) replaces.push(l + c + r.substring(1));
        }
    }
    
    return [...new Set([...deletes, ...transposes, ...replaces, ...inserts])]
}

function edits2(cachedEdits1, letters){
    let result = [];
    let e1, edits2, i;

    for(i = 0; i < cachedEdits1.length; i++){
        e1 = cachedEdits1[i];

        edits2 = edits1(e1, letters);

        result = result.concat(edits2);
    }
    
    return [...new Set([...result, ...cachedEdits1])];
}