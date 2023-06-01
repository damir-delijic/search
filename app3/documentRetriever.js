module.exports = class DocumentRetriever{

    constructor(reverseIndex){
        this.reverseIndex = reverseIndex;
    }

    retrieveDocuments(entryVector, query){
        let hits = this.retrieveHits(entryVector, query);
        let grouped = this.group(hits);
    }

    group(hits){

        // pretvara term -> appearances u document -> fields -> match,position

        let documents = [];
        let termFrequencyAfterFilter = {};
        let termDocumentFrequency
        let hit, appearance, document;
        let i, j, k;
        let documentIsSeenForTheFirstTime;

        let term, appearances, primary;

        for(i = 0; i < hits.length; i++){
            hit = hits[i];

            term = hit.t;
            appearances = hit.a;
            primary = hit.p;

            termFrequencyAfterFilter[term] = appearances.length; // u koliko se dokumenata javlja nakon filtera po query-u

            for(j = 0; j < appearances.length; j++){
                appearance = appearances[j];
                documentIsSeenForTheFirstTime = true;
                for(k = 0; k < documents.length; k++){
                    document = documents[k];
                    if(document.s == appearance.s && document.i == appearance.i){
                        documentIsSeenForTheFirstTime = false;
                        if(document.f[appearance.f]){
                            document.f[appearance.f].push({
                                ps: appearance.p, // pozicija
                                t: term, // rijec
                                p: primary // is primary
                            }); // nailazio je na dokument i na polje
                        }else{
                            document.f[appearance.f] = [{
                                ps: appearance.p,
                                t: term,
                                p: primary
                            }]; // nailazio je na dokument ali ne i na to polje
                        }
                        break;
                    }
                }

                if(documentIsSeenForTheFirstTime){ // ovo znaci da nije do sada naisao na taj dokument
                    let newDocument = {};
                    newDocument.s = appearance.s;
                    newDocument.i = appearance.i;
                    newDocument.f = {};
                    newDocument.f[appearance.f] = [{
                        ps: appearance.p,
                        t: term,
                        p: hit.primary
                    }];
                    documents.push(newDocument);
                }
            }
        }

        return {
            documents: documents,
            tdf: termDocumentFrequency
        };
    }

    filter(term, query){
        let result = [];
        
        let appearances = this.reverseIndex.getTermAppearances(term);
        let appearance, collection, field;
        let i,j,k;

        for(i = 0; i < appearances.length; i++){
            appearance = appearances[i];

            for(j = 0; j < query.collections.length; j++){
                collection = query.collections[j];
                if(collection.name == appearance.s){ // s je izvorna kolekcija (source)
                    for(k = 0; k < collection.fields.length; k++){
                        field = collection.fields[k];
                        if(appearance.f == field){ // f je polje kolekcije 
                            result.push(appearance);
                            break;
                        }
                    }
                    break;
                }
            }
        }

        return result
    }

    retrieveHits(entryVector, query){
        let hits = [];

        let entry, i, j, neighbor;

        for(i = 0; i < entryVector.length; i++){
            entry = entryVector[i];

            if(entry.estimate){
                hits.push({
                    t: entry.estimate, // term
                    a: this.filter(entry.estimate, query), // appearances filtered by query
                    p: true // isprimary
                });
                
                for(j = 0; j < entry.neighborhood.length; j++){
                    neighbor = entry.neighborhood[j];
                    hits.push({
                        t: neighbor, // term
                        a: this.filter(neighbor, query), // appearances filtered by query
                        p: false // isprimary term 
                    });
                }
            }
        }

        return hits;
    }

}