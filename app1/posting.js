module.exports = class Posting{

    constructor(){
        this.dict = {};
    }

    contains(word){
        if(this.dict[word]) return true;
        else return false
    }

    insert(term, source, id, field, position){

        let doc = {
            s: source,
            i: id,
            f: field,
            p: position
        }

        if(this.contains(term)){
            this.dict[term].fr += 1;
            this.dict[term].dl.push(doc);
        }else{
            this.dict[term] = {
                fr: 1,
                dl: [doc]
            }
        }
    }

    delete(id){
        let term, doc, i;
        
        for(term in this.dict){
            for(i = 0; i < this.dict[term].dl.length; i++){

                doc = this.dict[term].dl[i];
                if(doc.i == id){
                    this.dict[term].dl.splice(i, 1);
                    this.dict[term].fr -= 1;
                    i -= 1;
                }
            }
            if(this.dict[term].fr == 0){
                delete this.dict[term];
            }
        }
    }

}

