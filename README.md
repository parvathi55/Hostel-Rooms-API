# Hotel Rooms API

## Project Description

Hotel Rooms API is a REST API developed using Node.js and Express.js.
It helps manage hotel room information through API endpoints.

This project uses in-memory storage and does not require a database.

## Technologies Used

- Node.js
- Express.js
- JavaScript
- REST API
- JSON
- Visual Studio Code

## Features

- Create new hotel room records
- Retrieve a room by ID
- List all hotel rooms
- Update complete room details
- Update selected room fields
- Delete hotel room records
- Search rooms by name or location
- Filter rooms by type, availability, and price
- Sort room records
- Paginate room lists
- Validate request data
- Handle errors using HTTP status codes

## API Endpoints

| HTTP Method | Endpoint | Description |
|-------------|----------|-------------|
| POST | /api/rooms | Create a new room |
| GET | /api/rooms | Get all rooms with filtering and pagination |
| GET | /api/rooms/:id | Get a room by ID |
| PUT | /api/rooms/:id | Replace a complete room record |
| PATCH | /api/rooms/:id | Update selected room fields |
| DELETE | /api/rooms/:id | Delete a room |

## Installation and Setup

### 1. Install Node.js

Install Node.js on your computer.

### 2. Clone the Repository

Download or clone this repository to your computer.

### 3. Open the Project

Open the project folder in Visual Studio Code.

### 4. Install Dependencies

Run the following command in the terminal:

    npm install

### 5. Start the Server

Run:

    node index.js

The API runs on port 8080 by default.

Base URL:

    http://localhost:8080

## Example Request

Create a room using POST /api/rooms with this JSON body:

    {
      "name": "Lake View Deluxe",
      "location": "Ooty",
      "type": "Deluxe",
      "pricePerNight": 4500,
      "capacity": 3,
      "available": true,
      "roomNumber": "R-204"
    }

## Data Storage

Room records are stored in an in-memory array.
No database or external data file is used.

All room records are cleared when the server restarts.

## Error Handling

The API uses HTTP status codes such as:

- 201: Record created
- 200: Request successful
- 204: Record deleted successfully
- 400: Invalid request
- 404: Record not found
- 409: Duplicate room number

## Project Structure

    Hotel-Rooms-API/
    ├── index.js
    ├── package.json
    ├── package-lock.json
    ├── node_modules/
    └── README.md

## Conclusion

Hotel Rooms API demonstrates REST API development using Node.js and Express.js.
It includes CRUD operations, validation, filtering, searching, sorting,
pagination, and error handling.