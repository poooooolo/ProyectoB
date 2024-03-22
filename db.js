require("dotenv").config();
const {MongoClient, ObjectId} = require("mongodb");

//creamos la función para la conexión con la BBDD
function conectar(){
    return MongoClient.connect(process.env.DB_MONGO);
}

//probamos la conexión a la BBDD y que ocurre si hay un error
// conectar()
// .then(conexion => {
//     console.log("conectado a la bbdd")
// })
// .catch(error => {
//     console.log("algo falló")
// })

//creamos una función para leer las tareas
function getTareas(){
    return new Promise(async (fulfill,reject) => {
        
        try{//creamos una nueva conexion que sale de esperar a conectar()
            let conexion = await conectar();

            //acceso a la coleccion todo
            let todo = conexion.db("todo").collection("todo");

            //obtenemos lo que se encuentra en la BBDD y lo convertimos a un Array
            let tareas = await todo.find({}).toArray(); //retorna una promesa

            //cortamos la conexión
            conexion.close();

            //se cumple la promesa con la lista de tareas como argumento
            fulfill(tareas);

        }catch(error){//si hay algún error saldremos por aquí
            
            reject({error : "error en BBDD"});
        }
    })
}

//creamos una función para crear las tareas
function crearTarea(tarea){ //extraemos la tarea de peticion.body
    return new Promise(async (fulfill,reject) => {
        
        try{//creamos una nueva conexion que sale de esperar a conectar()
            let conexion = await conectar();
            
            //acceso a la coleccion todo
            let todo = conexion.db("todo").collection("todo");
            
            tarea.terminada = false;

            //esperamos a que la operación insertOne se realize antes de seguir, al final extraemos el id
            let {insertedId} = await todo.insertOne(tarea);

            conexion.close();

            //se cumple la promesa con el id del documento insertado como argumento
            fulfill({id : insertedId});

        }catch(error){

            reject({error : "error en BBDD"});
        }
    })

}

//creamos una función para borrar las tareas
function borrarTarea(id){
    return new Promise( async (fulfill,reject) => {

        try{//creamos una nueva conexion que sale de esperar a conectar()
            let conexion = await conectar();
        
            //acceso a la coleccion todo       
            let todo = conexion.db("todo").collection("todo");

            //con el método deleteOne borramos una tarea específica
            let {deletedCount} = await todo.deleteOne({_id : new ObjectId(id)});

            conexion.close();

            //se cumple la promesa devolviendo la cantidad de datos eliminados
            fulfill(deletedCount);            

        }catch(error){

            reject({error : "error en BBDD"})
        }
    })
}

//creamos una función para actualizar el estado
function actualizarEstado(id){
    return new Promise( async (fulfill,reject) => {

        try{//creamos una nueva conexion que sale de esperar a conectar()
            let conexion = await conectar();

            //acceso a la coleccion todo
            let todo = conexion.db("todo").collection("todo");

            //buscamos la tarea por el id
            let tarea = await todo.findOne({_id : new ObjectId(id)});

            //invertimos el estado de la tarea
            let nuevoEstado = !tarea.terminada;

            //actualizamos el estado de la tarea con su id correspondiente
            let actualizar = await todo.updateOne({_id : new ObjectId(id)}, {$set : {terminada : nuevoEstado}});

            //cerramos la conexión
            conexion.close();

            //vemos si realmente se ha modificado la tarea
            if(actualizar.modifiedCount === 1){

                fulfill(actualizar.modifiedCount);

            }else{

                throw new Error("No se pudo actualizar la tarea");

            }

        }catch(error){

            reject({error : "error en BBDD"})
        }
    })
}

//creamos una función para actualizar el texto
function actualizarTexto(id,tarea){
    return new Promise( async (fulfill,reject) => {
        
        try{

            let conexion = await conectar();

            let todo = conexion.db("todo").collection("todo");

            //actualizamos la tarea correspondiente
            let actualizar = await todo.updateOne({_id : new ObjectId(id)}, {$set : {tarea : tarea}});

             //cerramos la conexión
             conexion.close();

             //cumplimos la promesa
             fulfill(actualizar);

        }catch(error){

            reject({error : "error en BBDD"})
        }
    })
}

//probamos a saco
//  actualizarTexto("65fd6959ee1829e0738478b4","hkajsfhssssssssssssssssssssssssss")
//  .then(algo => console.log(algo))



module.exports = {getTareas,crearTarea,borrarTarea,actualizarEstado,actualizarTexto}