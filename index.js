import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import env from "dotenv";
import _ from "lodash";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));
env.config();

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});
db.connect();

let books = [];

app.get("/", async (req, res) => {

    try {
        const result = await db.query("SELECT DATE_TRUNC('day', date)::date as date, * FROM books");
        books = result.rows;
       
         // Fetch cover pages for each book using ISBN
        const booksWithCovers = await Promise.all(books.map(async (book) => {
        const isbn = book.isbn;
        const coverImage = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
        return {...book, coverImage };
      }));

        res.render("index.ejs", {
            books: booksWithCovers,
         
        });

    } catch (err) {
        console.log(err);
    }
    
});

app.get("/new", (req, res) => {
    res.render("new.ejs");
});

app.get("/note/:bookName", (req, res) => {
   const requestedTitle = _.lowerCase(req.params.bookName);

    books.forEach(book => {
        const storedTitle = _.lowerCase(book.title)
        if (storedTitle === requestedTitle) {
            res.render("note.ejs", {
                title: book.title,
                notes: book.notes
            });
        } else {
            console.log("Book NOT found");
        }
    });
})

app.post("/new", async (req, res) => {
    const title = req.body.title;
    const author = req.body.author;
    const description = req.body.description;
    const notes = req.body.notes;
    const date = req.body.date;
    const isbn = req.body.isbn;
    const rating = req.body.rating;
     
    try {
        await db.query("INSERT INTO books (title, author, description, notes, date, isbn, rating) VALUES ($1, $2, $3, $4, $5, $6, $7)",
            [title, author, description, notes, date, isbn, rating]);
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});