const express = require("express");

const app = express();
app.use(express.json());

let rooms = [];
let nextId = 1;

const PORT = process.env.PORT || 8080;

const fields = [
    "name",
    "location",
    "type",
    "pricePerNight",
    "capacity",
    "available",
    "roomNumber"
];

const roomTypes = ["Single", "Double", "Suite", "Deluxe", "Family"];

function errorResponse(res, status, message) {
    return res.status(status).json({ error: message });
}

function isObject(value) {
    return value !== null &&
        typeof value === "object" &&
        !Array.isArray(value);
}

function validateRoom(data) {
    if (!isObject(data)) return "Invalid body";

    for (const field of fields) {
        if (!(field in data)) return `Missing field: ${field}`;
    }

    if (typeof data.name !== "string" ||
        data.name.trim().length < 3 ||
        data.name.trim().length > 60) {
        return "Invalid name";
    }

    if (typeof data.location !== "string" ||
        data.location.trim().length < 2 ||
        data.location.trim().length > 40) {
        return "Invalid location";
    }

    if (typeof data.type !== "string" ||
        !roomTypes.includes(data.type)) {
        return "Invalid type";
    }

    if (typeof data.pricePerNight !== "number" ||
        !Number.isFinite(data.pricePerNight) ||
        data.pricePerNight <= 0 ||
        data.pricePerNight > 100000) {
        return "Invalid pricePerNight";
    }

    if (!Number.isInteger(data.capacity) ||
        data.capacity < 1 ||
        data.capacity > 10) {
        return "Invalid capacity";
    }

    if (typeof data.available !== "boolean") {
        return "Invalid available";
    }

    if (typeof data.roomNumber !== "string" ||
        data.roomNumber.trim().length < 4 ||
        data.roomNumber.trim().length > 20) {
        return "Invalid roomNumber";
    }

    return null;
}

function duplicateRoomNumber(roomNumber, idToIgnore = null) {
    return rooms.some(room =>
        room.id !== idToIgnore &&
        room.roomNumber.toLowerCase() === roomNumber.toLowerCase()
    );
}

function findId(idText) {
    if (!/^\d+$/.test(idText)) return null;

    const id = Number(idText);

    if (!Number.isSafeInteger(id) || id < 1) return null;

    return id;
}

// POST /api/rooms - Create room
app.post("/api/rooms", (req, res) => {
    const data = req.body;
    const validationError = validateRoom(data);

    if (validationError) {
        return errorResponse(res, 400, validationError);
    }

    if (duplicateRoomNumber(data.roomNumber.trim())) {
        return errorResponse(res, 409, "roomNumber already exists");
    }

    const room = {
        id: nextId++,
        name: data.name.trim(),
        location: data.location.trim(),
        type: data.type,
        pricePerNight: data.pricePerNight,
        capacity: data.capacity,
        available: data.available,
        roomNumber: data.roomNumber.trim()
    };

    rooms.push(room);

    return res.status(201).json(room);
});

// GET /api/rooms - List, filter, search, sort and paginate
app.get("/api/rooms", (req, res) => {
    const {
        page = "1",
        limit = "10",
        search = "",
        type,
        available,
        minPricePerNight,
        maxPricePerNight,
        sort,
        order = "asc"
    } = req.query;

    if (!/^\d+$/.test(page) || Number(page) < 1) {
        return errorResponse(res, 400, "Invalid page");
    }

    if (!/^\d+$/.test(limit) ||
        Number(limit) < 1 ||
        Number(limit) > 50) {
        return errorResponse(res, 400, "Invalid limit");
    }

    if (type !== undefined && !roomTypes.includes(type)) {
        return errorResponse(res, 400, "Invalid type");
    }

    if (available !== undefined &&
        available !== "true" &&
        available !== "false") {
        return errorResponse(res, 400, "Invalid available");
    }

    if (minPricePerNight !== undefined &&
        (minPricePerNight.trim() === "" ||
         !Number.isFinite(Number(minPricePerNight)))) {
        return errorResponse(res, 400, "Invalid minPricePerNight");
    }

    if (maxPricePerNight !== undefined &&
        (maxPricePerNight.trim() === "" ||
         !Number.isFinite(Number(maxPricePerNight)))) {
        return errorResponse(res, 400, "Invalid maxPricePerNight");
    }

    const minPrice = minPricePerNight === undefined
        ? undefined
        : Number(minPricePerNight);

    const maxPrice = maxPricePerNight === undefined
        ? undefined
        : Number(maxPricePerNight);

    const sortFields = ["name", "pricePerNight", "capacity"];

    if (sort !== undefined && !sortFields.includes(sort)) {
        return errorResponse(res, 400, "Invalid sort");
    }

    if (order !== "asc" && order !== "desc") {
        return errorResponse(res, 400, "Invalid order");
    }

    let result = [...rooms];

    // Filter
    if (type !== undefined) {
        result = result.filter(room => room.type === type);
    }

    if (available !== undefined) {
        result = result.filter(
            room => room.available === (available === "true")
        );
    }

    if (minPrice !== undefined) {
        result = result.filter(
            room => room.pricePerNight >= minPrice
        );
    }

    if (maxPrice !== undefined) {
        result = result.filter(
            room => room.pricePerNight <= maxPrice
        );
    }

    // Search name and location
    if (search.trim() !== "") {
        const term = search.trim().toLowerCase();

        result = result.filter(room =>
            room.name.toLowerCase().includes(term) ||
            room.location.toLowerCase().includes(term)
        );
    }

    // Sort
    if (sort !== undefined) {
        result.sort((a, b) => {
            let comparison;

            if (typeof a[sort] === "string") {
                comparison = a[sort].toLowerCase()
                    .localeCompare(b[sort].toLowerCase());
            } else {
                comparison = a[sort] - b[sort];
            }

            return order === "asc" ? comparison : -comparison;
        });
    }

    // Pagination
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const total = result.length;
    const totalPages = Math.ceil(total / limitNumber);
    const start = (pageNumber - 1) * limitNumber;

    result = result.slice(start, start + limitNumber);

    return res.status(200).json({
        data: result,
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages
    });
});

// GET /api/rooms/:id - Get one room
app.get("/api/rooms/:id", (req, res) => {
    const id = findId(req.params.id);

    if (id === null) {
        return errorResponse(res, 404, "Room not found");
    }

    const room = rooms.find(item => item.id === id);

    if (!room) {
        return errorResponse(res, 404, "Room not found");
    }

    return res.status(200).json(room);
});

// PUT /api/rooms/:id - Replace complete room
app.put("/api/rooms/:id", (req, res) => {
    const id = findId(req.params.id);

    if (id === null) {
        return errorResponse(res, 404, "Room not found");
    }

    const index = rooms.findIndex(room => room.id === id);

    if (index === -1) {
        return errorResponse(res, 404, "Room not found");
    }

    const validationError = validateRoom(req.body);

    if (validationError) {
        return errorResponse(res, 400, validationError);
    }

    const data = req.body;

    if (duplicateRoomNumber(data.roomNumber.trim(), id)) {
        return errorResponse(res, 409, "roomNumber already exists");
    }

    rooms[index] = {
        id,
        name: data.name.trim(),
        location: data.location.trim(),
        type: data.type,
        pricePerNight: data.pricePerNight,
        capacity: data.capacity,
        available: data.available,
        roomNumber: data.roomNumber.trim()
    };

    return res.status(200).json(rooms[index]);
});

// PATCH /api/rooms/:id - Update selected fields
app.patch("/api/rooms/:id", (req, res) => {
    const id = findId(req.params.id);

    if (id === null) {
        return errorResponse(res, 404, "Room not found");
    }

    const index = rooms.findIndex(room => room.id === id);

    if (index === -1) {
        return errorResponse(res, 404, "Room not found");
    }

    if (!isObject(req.body) ||
        Object.keys(req.body).length === 0) {
        return errorResponse(res, 400, "Request body cannot be empty");
    }

    const updated = { ...rooms[index] };

    for (const [key, value] of Object.entries(req.body)) {
        if (fields.includes(key)) {
            updated[key] = value;
        }
    }

    // Validate the final record
    const validationError = validateRoom(updated);

    if (validationError) {
        return errorResponse(res, 400, validationError);
    }

    if (duplicateRoomNumber(updated.roomNumber.trim(), id)) {
        return errorResponse(res, 409, "roomNumber already exists");
    }

    updated.name = updated.name.trim();
    updated.location = updated.location.trim();
    updated.roomNumber = updated.roomNumber.trim();

    rooms[index] = updated;

    return res.status(200).json(rooms[index]);
});

// DELETE /api/rooms/:id - Delete room
app.delete("/api/rooms/:id", (req, res) => {
    const id = findId(req.params.id);

    if (id === null) {
        return errorResponse(res, 404, "Room not found");
    }

    const index = rooms.findIndex(room => room.id === id);

    if (index === -1) {
        return errorResponse(res, 404, "Room not found");
    }

    rooms.splice(index, 1);

    return res.status(204).send();
});

// JSON 404 for unknown routes
app.use((req, res) => {
    return res.status(404).json({
        error: "Route not found"
    });
});

// Handle malformed JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return errorResponse(res, 400, "Invalid JSON");
    }

    return errorResponse(res, 500, "Internal server error");
});

app.listen(PORT, () => {
    console.log(`Hotel Rooms API running on port ${PORT}`);
});