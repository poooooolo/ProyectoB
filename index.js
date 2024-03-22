require("dotenv").config();
const express = require("express");
const {json} = require("body-parser");
const cors = require("cors");

//traemos la función de bd
const{getTareas,crearTarea,borrarTarea,actualizarEstado,actualizarTexto} = require("./db")

const app = express();

app.use(cors());

//cualquier cosa que venga con Content-type json es procesado por body-parser
app.use(json());

//usamos este middleware al inicio para ver si funcionan las conexiones
app.use("/probamos", express.static("./pruebas"));

//manejamos en este middleware todas las solicitudes GET a la ruta /todo
app.get("/todo", async(peticion,respuesta) => {

    try{
        
        //esperamos la vuelta de la promesa de getTareas y guardamos su resultado en tareas
        let tareas = await getTareas();

        //mapeamos el objeto del array tareas para devolver un objeto con la propiedad _id y la propiedad tareas
        tareas = tareas.map(({_id,tareas}) => {return {id: _id,tareas}});

        respuesta.json(tareas);

    }catch(error){
        respuesta.status(500);
        respuesta.json(error);
    }
});

//manejamos en este middleware todas las solicitudes POST a la ruta /todo/crear
app.post("/todo/crear", async (peticion,respuesta,siguiente) => {

    //extraemos la tarea del cuerpo de la petición
    let {tarea} = peticion.body; 

    //si tarea es verdadero y tarea sin nada antes ni después es igual a vacío entonces
    if(tarea && tarea.trim() != ""){
        try{

            //esperamos la vuelta de la promesa de crearTarea y guardamos el id creado
            let id = await crearTarea({tarea});

            //si se crea bien la tarea se envía una respuesta JSON que contiene el nuevo id
            return respuesta.json({id});

        }catch(error){
            respuesta.status(500);
            return respuesta.json(error);
        }
    }

    //si no hay tarea válida
    siguiente({error : "Falta el argumento en el objeto JSON"})
    
});

app.put("/todo/actualizar/:id([a-f0-9]{24})/:operacion(1|2)", async (peticion,respuesta) => {

    //cojo lo que ha escrito la persona en la url y lo guardo como numero en operacion
    let operacion = Number(peticion.params.operacion); 

    // 1 o 2
    let operaciones = [actualizarTexto,actualizarEstado]; //almaceno en un array las dos funciones
    //op1-> actualizar texto, op2-> actualizar estado

    let {tarea} = peticion.body;

    //si la operación no es 1 salta al catch
    if(operacion == 1 && (!tarea || tarea.trim() == "")){ //compruebo tarea en negativo, si falla, me da verdadero, si está es falso
       
        return siguiente({ error : "falta el argumento tarea en el objeto JSON" }); 
    }

    try{// en operacion entra 1 o 2, si es 1 -1 es indice 0 actualizarTexto y si es si es 2 es 2 -1 es indice 1 actualizarEstado
        let cantidad = await operaciones[operacion - 1](peticion.params.id, operacion == 1 ? tarea : null);
        
        respuesta.json({ resultado : cantidad ? "ok" : "ko" });

    }catch(error){

        respuesta.status(500);
        respuesta.json(error);
    }
});

app.delete("/todo/borrar/:id([a-f0-9]{24})", async (peticion,respuesta) => { //id es un parámetro dinámico que puede ser un número
    
    try{

        //llamamos a la función borrarTarea pasandole el parámetro id que sacamos de los parámetros de la petición
        let cantidad = await borrarTarea(peticion.params.id);

        //si la cantidad eliminada es mayor a 0 sale por el bien y si no por mal
        return respuesta.json({resultado : cantidad ? "bien" : "mal"});

    }catch(error){
        respuesta.status(500);
        return respuesta.json(error);
    }
});


//es el middleware por defecto
app.use((peticion,respuesta) => {
    respuesta.status(404);
    respuesta.json({error : "Not found"})
});

//
app.use((error,peticion,respuesta,siguiente) => {
    respuesta.status(400);
    respuesta.json({error : "Petición no válida"});
});

app.listen(process.env.PORT);