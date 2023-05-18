function one(){
    consoe.log('print')
}

try{
    one();
}catch(e){
    let error = {
        result: false,
        msg: 'custommsg',
        error: e
    }
    console.log(error);
}