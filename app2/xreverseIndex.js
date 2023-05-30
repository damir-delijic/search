module.exports = class ReverseIndex{

    constructor(){
        this.dictionary = {};
    }

    contains(word){
        if(this.dictionary[word]) return true;
        else return false
    }

    print(){
        for(let word in this.dictionary){
            console.log("Word: ", word);
            console.log("Frequency: ", this.dictionary[word].fr);
            console.log("Documents: ", this.dictionary[word].dl);
        }
    }

    getTermFrequency(term){
        if(this.contains(term)){
            return this.dictionary[term].fr;
        }else{
            return 0;
        }
    }

    getTermAppearances(term){
        if(this.contains(term)){
            return this.dictionary[term].dl;
        }else{
            return [];
        }
    }

    insert(word, source, id, field, position){

        let doc = {
            s: source,
            i: id,
            f: field,
            p: position
        }

        if(this.contains(word)){
            this.dictionary[word].fr += 1;
            this.dictionary[word].dl.push(doc);
        }else{
            this.dictionary[word] = {
                fr: 1,
                dl: [doc]
            }
        }
    }

    deleteWord(word){
        if(this.contains(word)){
            delete this.dictionary[word];
        }
    }

    deleteDocument(source, id){
        let word, doc, i;
        
        for(word in this.dictionary){
            for(i = 0; i < this.dictionary[word].dl.length; i++){

                doc = this.dictionary[word].dl[i];
                if(doc.s == source && doc.i == id){
                    this.dictionary[word].dl.splice(i, 1);
                    this.dictionary[word].fr -= 1;
                    i -= 1;
                }
            }
            if(this.dictionary[word].fr == 0){
                this.deleteWord(word)
            }
        }
    }

}

/*
        dictionary = {
            "rijec": {
                "fr": k, ----- k > 0 (frequency, ucestalost)
                "dl":[  --------- (document list, lista pojavljivanja)
                    {
                        "s": "movies", ---- (source kolekcija)
                        "i": "12", ----- (id dokumenta u toj kolekciji)
                        "f": "title", ----- (polje u kom se pojavila rijec)
                        "p": 1 ------- (pozicija u polju te rijeci)
                    },
                    {
                        ...
                    },
                    .
                    .
                    .
                ]
            }
        }
    */

