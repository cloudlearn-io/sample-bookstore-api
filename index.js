const express = require("express")
const swaggerUi = require("swagger-ui-express")
const swaggerDocument = require("./swagger.json")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

// --- Seed Data ---

const authors = [
  { id: 1, name: "George Orwell", bio: "English novelist known for his sharp criticism of political oppression." },
  { id: 2, name: "Frank Herbert", bio: "American science fiction author best known for Dune." },
  { id: 3, name: "Agatha Christie", bio: "English writer known for her detective novels and short stories." },
  { id: 4, name: "Walter Isaacson", bio: "American author and journalist known for his biographies of notable figures." },
  { id: 5, name: "Toni Morrison", bio: "American novelist celebrated for her powerful exploration of Black American life." }
]

let books = [
  { id: 1, title: "1984", authorId: 1, author: "George Orwell", genre: "Fiction", price: 12.99, inStock: true },
  { id: 2, title: "Animal Farm", authorId: 1, author: "George Orwell", genre: "Fiction", price: 9.99, inStock: true },
  { id: 3, title: "Dune", authorId: 2, author: "Frank Herbert", genre: "Science Fiction", price: 15.99, inStock: true },
  { id: 4, title: "Dune Messiah", authorId: 2, author: "Frank Herbert", genre: "Science Fiction", price: 14.99, inStock: false },
  { id: 5, title: "Murder on the Orient Express", authorId: 3, author: "Agatha Christie", genre: "Mystery", price: 11.99, inStock: true },
  { id: 6, title: "The ABC Murders", authorId: 3, author: "Agatha Christie", genre: "Mystery", price: 10.99, inStock: true },
  { id: 7, title: "Steve Jobs", authorId: 4, author: "Walter Isaacson", genre: "Biography", price: 18.99, inStock: true },
  { id: 8, title: "Beloved", authorId: 5, author: "Toni Morrison", genre: "Fiction", price: 13.99, inStock: true }
]

let nextBookId = 9

// --- Swagger UI ---

app.get("/swagger.json", (req, res) => {
  res.json(swaggerDocument)
})

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  swaggerOptions: { url: "/swagger.json" }
}))

// --- Book Routes ---

app.get("/books", (req, res) => {
  const { genre } = req.query
  if (genre) {
    const filtered = books.filter((b) => b.genre === genre)
    return res.json(filtered)
  }
  res.json(books)
})

app.get("/books/:bookId", (req, res) => {
  const id = parseInt(req.params.bookId, 10)
  const book = books.find((b) => b.id === id)
  if (!book) {
    return res.status(404).json({ error: "Book not found" })
  }
  res.json(book)
})

app.post("/books", (req, res) => {
  const { title, authorId, genre, price, inStock } = req.body

  if (!title || !authorId || !genre || price === undefined) {
    return res.status(400).json({ error: "Missing required fields: title, authorId, genre, price" })
  }

  const author = authors.find((a) => a.id === authorId)
  if (!author) {
    return res.status(400).json({ error: "Author not found" })
  }

  const validGenres = ["Fiction", "Non-Fiction", "Science Fiction", "Mystery", "Biography"]
  if (!validGenres.includes(genre)) {
    return res.status(400).json({ error: `Invalid genre. Must be one of: ${validGenres.join(", ")}` })
  }

  const book = {
    id: nextBookId++,
    title,
    authorId,
    author: author.name,
    genre,
    price,
    inStock: inStock !== undefined ? inStock : true
  }
  books = [...books, book]
  res.status(201).json(book)
})

app.put("/books/:bookId", (req, res) => {
  const id = parseInt(req.params.bookId, 10)
  const index = books.findIndex((b) => b.id === id)
  if (index === -1) {
    return res.status(404).json({ error: "Book not found" })
  }

  const { title, authorId, genre, price, inStock } = req.body
  const existing = books[index]

  let authorName = existing.author
  if (authorId !== undefined) {
    const author = authors.find((a) => a.id === authorId)
    if (!author) {
      return res.status(400).json({ error: "Author not found" })
    }
    authorName = author.name
  }

  if (genre !== undefined) {
    const validGenres = ["Fiction", "Non-Fiction", "Science Fiction", "Mystery", "Biography"]
    if (!validGenres.includes(genre)) {
      return res.status(400).json({ error: `Invalid genre. Must be one of: ${validGenres.join(", ")}` })
    }
  }

  const updated = {
    ...existing,
    title: title !== undefined ? title : existing.title,
    authorId: authorId !== undefined ? authorId : existing.authorId,
    author: authorName,
    genre: genre !== undefined ? genre : existing.genre,
    price: price !== undefined ? price : existing.price,
    inStock: inStock !== undefined ? inStock : existing.inStock
  }

  books = books.map((b, i) => (i === index ? updated : b))
  res.json(updated)
})

app.delete("/books/:bookId", (req, res) => {
  const id = parseInt(req.params.bookId, 10)
  const book = books.find((b) => b.id === id)
  if (!book) {
    return res.status(404).json({ error: "Book not found" })
  }
  books = books.filter((b) => b.id !== id)
  res.json({ message: `Book '${book.title}' deleted successfully` })
})

// --- Author Routes ---

app.get("/authors", (req, res) => {
  res.json(authors)
})

app.get("/authors/:authorId", (req, res) => {
  const id = parseInt(req.params.authorId, 10)
  const author = authors.find((a) => a.id === id)
  if (!author) {
    return res.status(404).json({ error: "Author not found" })
  }
  const authorBooks = books.filter((b) => b.authorId === id)
  res.json({ ...author, books: authorBooks })
})

// --- Root ---

app.get("/", (req, res) => {
  res.json({
    name: "Bookstore API",
    version: "1.0.0",
    docs: "/api-docs"
  })
})

app.listen(PORT, () => {
  console.log(`Bookstore API running on port ${PORT}`)
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`)
})
