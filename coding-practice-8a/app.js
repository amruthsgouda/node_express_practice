const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeServerAndDb = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(5000, () => {
      console.log("Server hosted at http://localhost:5000/");
    });
  } catch (error) {
    response.send(`Server/ DB error: ${error.message}`);
    process.exit(1);
  }
};

initializeServerAndDb();

//API1
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

app.get("/todos/", async (request, response) => {
  try {
    const { status, priority, search_q = "" } = request.query;
    let getTodoQuery = "";

    switch (true) {
      case hasPriorityAndStatusProperties(request.query):
        getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status= "${status}" AND priority = "${priority}";`;
        break;
      case hasPriorityProperty(request.query):
        getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND priority = "${priority}";`;
        break;
      case hasStatusProperty(request.query):
        getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%" AND status= "${status}";`;
        break;
      default:
        getTodoQuery = `SELECT * FROM todo WHERE todo LIKE "%${search_q}%";`;
        break;
    }

    const dbResponse = await db.all(getTodoQuery);
    response.send(dbResponse);
  } catch (error) {
    response.send(`API1 error: ${error.message}`);
    process.exit(1);
  }
});

//API2
app.get("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const getTodoByIdQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
    const dbResponse = await db.get(getTodoByIdQuery);
    response.send(dbResponse);
  } catch (error) {
    response.send(`API2 error: ${error.message}`);
    process.exit(1);
  }
});

//API3
app.post("/todos/", async (request, response) => {
  try {
    const todoDetails = request.body;
    const { id, todo, priority, status } = todoDetails;
    const postTodoQuery = `INSERT INTO todo (id, todo, priority, status) VALUES ('${id}', '${todo}', '${priority}', '${status}');`;
    await db.run(postTodoQuery);
    response.send("Todo Successfully Added");
  } catch (error) {
    response.send(`API3 error: ${error.message}`);
    process.exit(1);
  }
});

//API4
app.put("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    let updateType = "";
    const requestBody = request.body;

    switch (true) {
      case requestBody.status !== undefined:
        updateType = "Status";
        break;
      case requestBody.priority !== undefined:
        updateType = "Priority";
        break;
      case requestBody.todo !== undefined:
        updateType = "Todo";
        break;
      default:
        updateType = "";
        break;
    }

    const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId}`;
    const previousTodo = await db.get(previousTodoQuery);
    const {
      status = previousTodo.status,
      priority = previousTodo.priority,
      todo = previousTodo.todo,
    } = request.body;

    const updateTodoQuery = `UPDATE todo SET todo = '${todo}', status='${status}', priority ='${priority}' WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send(`${updateType} Updated`);
  } catch (error) {
    response.send(`API4 error: ${error.message}`);
    process.exit(1);
  }
});

//API5
app.delete("/todos/:todoId/", async (request, response) => {
  try {
    const { todoId } = request.params;
    const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
    await db.run(deleteTodoQuery);
    response.send("Todo Deleted");
  } catch (error) {
    response.send(`API5 error: ${error.message}`);
    process.exit(1);
  }
});

module.exports = app;
