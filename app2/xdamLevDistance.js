module.exports = class DamLevDistance{

    // http://norvig.com/spell-correct.html

    constructor(letters){
        this.letters = letters; // zavisi od jezika
    }

    calculateSingle(word){
        let edits1 = this.edits1(word);
        return this.edits2(edits1);
    }

    calculateDouble(word){
        return this.edits1(word);
    }

    edits1(word){
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

            for(j = 0; j < this.letters.length; j++){
                c = this.letters[j];
                inserts.push(l + c + r);
                if(r) replaces.push(l + c + r.substring(1));
            }
        }
        
        return [...new Set([...deletes, ...transposes, ...replaces, ...inserts])]
    }

    edits2(cachedEdits1){
        let result = [];
        let e1, edits2, i;

        for(i = 0; i < cachedEdits1.length; i++){
            e1 = cachedEdits1[i];

            edits2 = this.edits1(e1);

            result = result.concat(edits2);
        }
        
        return [...new Set([...result, ...cachedEdits1])];
    }

}