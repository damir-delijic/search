
module.exports = class PostingList{

    // put do json fajla
    constructor(datapath, preprocessor, fieldNames, readPersisted, persistedPath){
        this.datapath = datapath;
        this.preprocessor = preprocessor;
        this.fieldNames = fieldNames;
        this.persistedPath = persistedPath;
        this.dict = {};
        if(readPersisted){
            this.readPostingList();
        }else{
            this.initialize();
        }
    }

    constructPostingList(){
        
    }

    initialize(){
        let fs = require('fs');
        let data = JSON.parse(fs.readFileSync(this.datapath, 'utf8'));

        let documents = data.documents;
        let doc;
        for(let i = 0; i < documents.length; i++){
            doc = documents[i];
            this.insert(doc);
        }

        this.savePostingList();
    }

    processDocument(doc){
        let terms, term, i, j, fieldName, content;
        
        for(j = 0; j < this.fieldNames.length; j++){
            fieldName = this.fieldNames[j];
            content = doc[fieldName]; // sva polja su stringovi
            terms = this.preprocessor.process(content);
            for(i = 0; i < terms.length; i++){
                term = terms[i];
                this.processTerm(term, fieldName, doc.id, i, doc.title);
            }
        }
    }

    processTerm(term, field, docId, position, docTitle){
        if(this.dict[term]){

            this.dict[term].frequency++;

            let isFound = false;
            let doc;
            for(let i = 0; i < this.dict[term].docs.length; i++){
                doc = this.dict[term].docs[i];
                if(doc.id == docId){
                    isFound = true;
                    doc.positions[field].push(position);
                }
            }

            if(!isFound){
                let doc = {
                    id: docId,
                    title: docTitle,
                    positions:{}
                }
                doc.positions[field] = [position];
                this.dict[term].docs.push(doc);
            }

        }else{

            let doc = {
                id: docId,
                title: docTitle,
                positions: {}
            }

            doc.positions[field] = [position];

            this.dict[term] = {
                frequency: 1,
                docs: [doc]
            }
        }
    }

    insert(document){
        this.processDocument(document);
    }

    deleteDocument(id){
        let i, docs, doc;
        
        for(let term in this.dict){
            docs = term.docs;
            for(i = 0; i < docs.length; i++){
                doc = docs[i];
                if(doc.id == id){
                    docs.splice(i, 1);
                    break;
                }
            }
        }
    }

    deleteTerm(term){
        delete this.dict[term];
    }

    savePostingList(){
        let writeObj = {
            'dict': this.dict
        }
        let fs = require('fs');
        var writer = fs.createWriteStream(this.persistedPath, {
            flags: 'w' // 'a' means appending (old data will be preserved)
        });

        writer.write(JSON.stringify(writeObj));
    }

    readPostingList(){
        let fs = require('fs');
        let data = JSON.parse(fs.readFileSync(this.persistedPath, 'utf8'));

        this.dict = data.dict;
    }
}

