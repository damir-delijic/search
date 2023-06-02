const Ranking = require('./ranking');

module.exports = class Retriever{

    /* Za dati query vektor vraca sortiranu, rangiranu listu relevatnih dokumenata (uz pomoc ranker-a) */
    /* Trebaju mu indeksna struktura, konfiguracija i ranker */
    /* Retrieve za vektor i 'collections'(filter po kolekcijama i poljima kolekcijes) vadi dokumente za date pojmove, filtrira po filterima ... */
    /* ... cuva odredjene mjere vezane za termine po kojim se vrsi upit dok su u pogodnom formatu ... */
    /* ... zatim grupise po dokumentima [lista dokumenata] */
    /* dokument ->  source, id, polja: { imepolja: [lista pozicija i pojmova], imedrugogpolja: [-||-]}*/
    /* Grupisani podaci zajedno sa mjerama vezanim za termine se predaju komponenti za rangiranje */
    /* koja na kraju vraca [lista dokumenata, dokument -> source,id,score] koji se na krajus sortiraju po skoru*/

    constructor(rindex, config){
        this.rindex = rindex;
        this.config = config;
        this.ranking = new Ranking(this.config);
    }

    retrieve(vector, collections, relevantFlens){
        let hitsVector = this.getHitsVector(vector, collections)
        let termsMeasures = this.getTermsMeasures(hitsVector); // u koliko se dokumenata javlja nakon filtera, globalna frekvencija ima u rindex
        let documents = this.groupByDocument(hitsVector);
        let ranked = this.ranking.rank(documents, termsMeasures, relevantFlens);
        let sorted = this.sort(ranked);
        return sorted;
    }

    filter(term, collections){
        let result = [];
        
        let appearances = this.rindex.getAppearances(term);
        let appearance, collection, field;
        let i,j,k;

        for(i = 0; i < appearances.length; i++){
            appearance = appearances[i];

            for(j = 0; j < collections.length; j++){
                collection = collections[j];
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

    getHitsVector(vector, collections){
        let hits = [];

        let entry, i, j;

        for(i = 0; i < vector.length; i++){
            entry = vector[i];

            let hit = {
                term: entry.estimate,
                appearances: this.filter(entry.estimate, collections),
                score: entry.score
            }

            hits.push(hit)
        }

        return hits;
    }

    getTermsMeasures(hitsVector){
        let termsMeasures = {};
        let i, hit, term;
        for(i = 0; i < hitsVector.length; i++){
            hit = hitsVector[i];
            term = hit.term;
            termsMeasures[term] = {
                local: hit.appearances.length,
                global: this.rindex.getFrequency(term),
                factor: hit.score
            }
        }
        return termsMeasures;
    }

    groupByDocument(hitsVector){

        let documents = [];

        let hit, appearance, document;
        let i, j, k;
        let documentFirstTimeSeen;

        let term, appearances, primary;

        for(i = 0; i < hitsVector.length; i++){
            hit = hitsVector[i];

            term = hit.term;
            appearances = hit.appearances;

            for(j = 0; j < appearances.length; j++){
                appearance = appearances[j];
                documentFirstTimeSeen = true;

                for(k = 0; k < documents.length; k++){
                    document = documents[k];

                    if(document.s == appearance.s && document.i == appearance.i){
                        documentFirstTimeSeen = false;
                        if(document.f[appearance.f]){
                            document.f[appearance.f].push({
                                ps: appearance.p, // pozicija
                                t: term // rijec
                            }); // nailazio je na dokument i na polje
                        }else{
                            document.f[appearance.f] = [{
                                ps: appearance.p,
                                t: term
                            }]; // nailazio je na dokument ali ne i na to polje
                        }
                        break;
                    }
                }

                if(documentFirstTimeSeen){ // ovo znaci da nije do sada naisao na taj dokument
                    let newDocument = {};
                    newDocument.s = appearance.s;
                    newDocument.i = appearance.i;
                    newDocument.f = {};
                    newDocument.f[appearance.f] = [{
                        ps: appearance.p,
                        t: term
                    }];
                    documents.push(newDocument);
                }
            }
        }

        return documents;
    }

    sort(documents){
        let sortedDocuments = [];
        let document, i;
        while(documents.length > 0){
            document = documents.shift();

            for(i = 0; i < sortedDocuments.length; i++){
                if(document.score > sortedDocuments[i].score){
                    break;
                }
            }
            sortedDocuments.splice(i, 0, document);
        }
        return sortedDocuments;
    }

}