
module.exports = class PostingList{

    constructor(){
        this.dict = {};
    }

    insert(term, field, documentId, position){
        let termData = this.dict[term];
        let isKnown = termData;

        if(isKnown){
            termData.fr++;

            let fieldData = termData[field];
            let hasFieldEntry = fieldData;

            if(hasFieldEntry){
                let docs = fieldData.docs;
                let doc, i;
                let notFound = true;
                for(i = 0; i < docs.length; i++){
                    doc = docs[i];
                    if(doc.id == documentId){
                        notFound = false;
                        doc.positions.push(position);
                        break;
                    }
                }

                if(notFound){
                    doc = {
                        id: documentId,
                        positions: [position]
                    };
                    docs.push(doc);
                }


            }else{
                termData[field] = {
                    docs: [
                        {
                            id: documentId,
                            positions: [position]
                        }
                    ]
                };

            }

        }else{

            let obj = {};

            obj['fr'] = 1;
            obj[field] = {
                docs:  [
                    {
                        id: documentId,
                        positions: [position]
                    }
                ]
            };

            this.dict[term] = obj;
        }
    }

}

