require("express-async-errors");

const express = require("express");
const app = express();
const routes = require("./routes");
const AppError = require("./utils/AppError");
const migrationsRun = require("./database/sqlite/migrations");

app.use(express.json());
app.use(routes);

migrationsRun();

app.use((error, req, res, next) => {
    if(error instanceof AppError) {
        
        return res.status(error.statusCode).json({
            status: "error",
            message: error.message
        });   
    }
    
    console.error(error);
    
    return res.status(500).json({
        status: "error",
        error: error,
        message: "Internal Server Error",
    });
}); 

const PORT = 3333;
app.listen(PORT, () => console.log("Server Running"));