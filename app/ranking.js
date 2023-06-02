module.exports = class Ranking{

    /* Daje score dokumentima u odnosu na query */
    /* Da bi rangirao, potrebni su mu lista dokumenata, mjere za termine kao sto su lokalna globalna frekvencija, broj relevantnih dokumenata i da li je primarni/sekundarni/sinonim, i duzine polja svakog dokumenta */
    /* Ocjenjuje dokument na osnovu tezina polja, duzine polja, ocjene terma */
    constructor(config){
        this.config = config;
    }

    rank(documents, termsMeasures, relevantFlens){
        let result = [];

        let numberOfDocuments, i, document;

        numberOfDocuments = documents.length;

        this.calculateTermsScores(termsMeasures, numberOfDocuments);
       
        for(i = 0; i < documents.length; i++){
            document = documents[i];

            let score = this.scoreDocument(document, termsMeasures, relevantFlens[document.s]);

            result.push({
                source: document.s,
                id: document.i,
                score: score
            });
        }


        return result;
    }

    calculateTermsScores(termsMeasures, numberOfDocuments){
        let term, measures;
        for(term in termsMeasures){
            measures = termsMeasures[term];
            termsMeasures[term] = this.termScore(measures.local, measures.global, numberOfDocuments, measures.factor);
        }
    }

    scoreDocument(document, termsMeasures, flens){
        let result = 0.01;
        let weightsum = 0.01;

        let field, fscore, fweight;

        for(field in document.f){
            fscore = this.scoreField(document.f[field], termsMeasures);
            fscore = fscore / flens[document.i][field];
            fweight = this.config.collections[document.s].fields[field].weight;
            result += (fscore * fweight);
            weightsum += fweight;
        }

        result = parseFloat((result / weightsum).toFixed(4));

        return result;
    }

    scoreField(termPositions, termsMeasures){
        if(termPositions.length == 0) return 0; // ne bi trebalo da se desava
        let sortedTermPositions = [];
        let termPosition, i;

        while(termPositions.length > 0){
            termPosition = termPositions.shift();
            for(i = 0; i < sortedTermPositions.length; i++){
                if(termPosition.ps < sortedTermPositions[i]){
                    break;
                }
            }
            sortedTermPositions.splice(i, 0, termPosition);
        }

        let score = 0;
        let previous, current, accumulated, accumulationFactor;

        previous = sortedTermPositions.shift();
        accumulated = termsMeasures[previous.t];
        accumulationFactor = 1;

        while(sortedTermPositions.length > 0){
            current = sortedTermPositions.shift();
            if(current.ps - previous.ps <= 1){
                accumulationFactor += 1;
                accumulated += termsMeasures[current.t];
            }else{
                score += (accumulated * accumulationFactor);
                accumulated = termsMeasures[current.t];
                accumulationFactor = 1;
            }
        }

        score += (accumulated * accumulationFactor);
        return score;

    }

    termScore(localF, globalF, numOfDocuments, primary){
        return parseFloat(primary * (1 + (Math.log(numOfDocuments / localF)) * (1 + Math.log(globalF / localF))).toFixed(4));
    }

}