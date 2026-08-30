# ============================================================
# FOODCONNECT
# SMART FOOD DONATION NETWORK
# COMPLETE FLASK BACKEND
# ============================================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import math
from datetime import datetime


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

CORS(app)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

DATABASE = os.path.join(
    BASE_DIR,
    "food_donation.db"
)


# ============================================================
# DATABASE CONNECTION
# ============================================================

def get_db_connection():

    conn = sqlite3.connect(
        DATABASE
    )

    conn.row_factory = sqlite3.Row

    return conn


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db():

    conn = get_db_connection()

    cursor = conn.cursor()


    # ========================================================
    # USERS TABLE
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT UNIQUE NOT NULL,

            password TEXT NOT NULL,

            phone TEXT,

            role TEXT NOT NULL,

            latitude REAL,

            longitude REAL,

            address TEXT

        )
    """)


    # ========================================================
    # DONATIONS TABLE
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS donations (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            donor_id INTEGER,

            donor_name TEXT NOT NULL,

            food_name TEXT NOT NULL,

            quantity INTEGER NOT NULL,

            food_type TEXT,

            pickup_time TEXT,

            latitude REAL,

            longitude REAL,

            address TEXT,

            status TEXT DEFAULT 'Available',

            created_at TEXT,

            FOREIGN KEY (donor_id)
                REFERENCES users(id)

        )
    """)


    # ========================================================
    # NGO TABLE
    # ========================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ngos (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            contact TEXT,

            latitude REAL,

            longitude REAL,

            address TEXT

        )
    """)


    # ========================================================
    # CHECK WHETHER DONOR_ID EXISTS
    # ========================================================

    columns = cursor.execute(
        "PRAGMA table_info(donations)"
    ).fetchall()


    column_names = [
        column["name"]
        for column in columns
    ]


    # ========================================================
    # ADD DONOR_ID TO OLD DATABASE
    # ========================================================

    if "donor_id" not in column_names:

        print(
            "Adding donor_id column to donations table..."
        )

        cursor.execute("""
            ALTER TABLE donations
            ADD COLUMN donor_id INTEGER
        """)


    conn.commit()


    # ========================================================
    # LINK OLD DONATIONS TO USERS
    #
    # This tries to connect existing donations using
    # donor_name -> users.name.
    #
    # Existing donations will therefore also work
    # with the new donor-ID system whenever the names match.
    # ========================================================

    cursor.execute("""
        UPDATE donations

        SET donor_id = (

            SELECT users.id

            FROM users

            WHERE LOWER(TRIM(users.name))
                = LOWER(TRIM(donations.donor_name))

            LIMIT 1

        )

        WHERE donor_id IS NULL
    """)


    conn.commit()


    # ========================================================
    # CREATE INDEX FOR FASTER DONOR SEARCH
    # ========================================================

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS
        idx_donations_donor_id
        ON donations(donor_id)
    """)


    conn.commit()

    conn.close()


    print(
        "Database initialization completed."
    )


# ============================================================
# HELPER - CONVERT ROWS TO DICTIONARY
# ============================================================

def row_to_dict(row):

    if row is None:

        return None

    return dict(row)


# ============================================================
# HELPER - CALCULATE DISTANCE
# ============================================================

def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):

    try:

        lat1 = float(lat1)
        lon1 = float(lon1)
        lat2 = float(lat2)
        lon2 = float(lon2)

    except (
        TypeError,
        ValueError
    ):

        return None


    # Earth radius in kilometers

    R = 6371


    lat1_rad = math.radians(lat1)

    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(
        lat2 - lat1
    )

    delta_lon = math.radians(
        lon2 - lon1
    )


    a = (

        math.sin(delta_lat / 2) ** 2

        +

        math.cos(lat1_rad)
        *
        math.cos(lat2_rad)
        *
        math.sin(delta_lon / 2) ** 2

    )


    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )


    return R * c


# ============================================================
# HOME
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({

        "message":
            "FoodConnect API is running successfully.",

        "backend":
            "Flask",

        "database":
            "SQLite",

        "status":
            "online"

    })


# ============================================================
# DATABASE STATUS
# ============================================================

@app.route("/api/status", methods=["GET"])
def database_status():

    conn = get_db_connection()

    try:

        users = conn.execute(
            "SELECT COUNT(*) AS count FROM users"
        ).fetchone()["count"]


        donations = conn.execute(
            "SELECT COUNT(*) AS count FROM donations"
        ).fetchone()["count"]


        available = conn.execute("""
            SELECT COUNT(*) AS count

            FROM donations

            WHERE status = 'Available'
        """).fetchone()["count"]


        accepted = conn.execute("""
            SELECT COUNT(*) AS count

            FROM donations

            WHERE status = 'Accepted'
        """).fetchone()["count"]


        collected = conn.execute("""
            SELECT COUNT(*) AS count

            FROM donations

            WHERE status = 'Collected'
        """).fetchone()["count"]


        return jsonify({

            "database_exists":
                os.path.exists(DATABASE),

            "database_file":
                DATABASE,

            "users":
                users,

            "donations":
                donations,

            "available":
                available,

            "accepted":
                accepted,

            "collected":
                collected

        })


    finally:

        conn.close()


# ============================================================
# REGISTER USER
# ============================================================

@app.route(
    "/api/register",
    methods=["POST"]
)
def register():

    data = request.get_json()

    if not data:

        return jsonify({
            "error": "No data received."
        }), 400


    name = str(
        data.get("name", "")
    ).strip()


    email = str(
        data.get("email", "")
    ).strip()


    password = str(
        data.get("password", "")
    )


    phone = str(
        data.get("phone", "")
    ).strip()


    role = str(
        data.get("role", "DONOR")
    ).strip().upper()


    latitude = data.get(
        "latitude"
    )


    longitude = data.get(
        "longitude"
    )


    address = str(
        data.get("address", "")
    ).strip()


    # ========================================================
    # VALIDATION
    # ========================================================

    if not name:

        return jsonify({
            "error": "Name is required."
        }), 400


    if not email:

        return jsonify({
            "error": "Email is required."
        }), 400


    if not password:

        return jsonify({
            "error": "Password is required."
        }), 400


    if role not in [
        "DONOR",
        "NGO"
    ]:

        return jsonify({
            "error":
                "Role must be DONOR or NGO."
        }), 400


    conn = get_db_connection()


    try:

        existing = conn.execute(
            """
            SELECT id
            FROM users
            WHERE LOWER(email) = LOWER(?)
            """,
            (email,)
        ).fetchone()


        if existing:

            return jsonify({
                "error":
                    "Email already registered."
            }), 409


        # ====================================================
        # INSERT USER
        # ====================================================

        cursor = conn.execute(
            """
            INSERT INTO users (

                name,
                email,
                password,
                phone,
                role,
                latitude,
                longitude,
                address

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,

            (
                name,
                email,
                password,
                phone,
                role,
                latitude,
                longitude,
                address
            )

        )


        user_id = cursor.lastrowid


        # ====================================================
        # IF NGO, ALSO CREATE NGO RECORD
        # ====================================================

        if role == "NGO":

            conn.execute(
                """
                INSERT INTO ngos (

                    name,
                    contact,
                    latitude,
                    longitude,
                    address

                )

                VALUES (?, ?, ?, ?, ?)
                """,

                (
                    name,
                    phone,
                    latitude,
                    longitude,
                    address
                )

            )


        conn.commit()


        return jsonify({

            "message":
                "Registration successful.",

            "user": {

                "id":
                    user_id,

                "name":
                    name,

                "email":
                    email,

                "role":
                    role

            }

        }), 201


    except sqlite3.IntegrityError:

        conn.rollback()

        return jsonify({
            "error":
                "Email already registered."
        }), 409


    finally:

        conn.close()


# ============================================================
# LOGIN
# ============================================================

@app.route(
    "/api/login",
    methods=["POST"]
)
def login():

    data = request.get_json()


    if not data:

        return jsonify({
            "error":
                "No login data received."
        }), 400


    email = str(
        data.get("email", "")
    ).strip()


    password = str(
        data.get("password", "")
    )


    if not email or not password:

        return jsonify({
            "error":
                "Email and password are required."
        }), 400


    conn = get_db_connection()


    try:

        user = conn.execute(
            """
            SELECT
                id,
                name,
                email,
                password,
                phone,
                role,
                latitude,
                longitude,
                address

            FROM users

            WHERE LOWER(email) = LOWER(?)
            """,

            (email,)
        ).fetchone()


        if not user:

            return jsonify({
                "error":
                    "Invalid email or password."
            }), 401


        if user["password"] != password:

            return jsonify({
                "error":
                    "Invalid email or password."
            }), 401


        return jsonify({

            "message":
                "Login successful.",

            "user": {

                "id":
                    user["id"],

                "name":
                    user["name"],

                "email":
                    user["email"],

                "phone":
                    user["phone"],

                "role":
                    user["role"],

                "latitude":
                    user["latitude"],

                "longitude":
                    user["longitude"],

                "address":
                    user["address"]

            }

        })


    finally:

        conn.close()


# ============================================================
# CREATE DONATION
# ============================================================

@app.route(
    "/api/donations",
    methods=["POST"]
)
def create_donation():

    data = request.get_json()


    if not data:

        return jsonify({
            "error":
                "No donation data received."
        }), 400


    donor_id = data.get(
        "donor_id"
    )


    donor_name = str(
        data.get(
            "donor_name",
            ""
        )
    ).strip()


    food_name = str(
        data.get(
            "food_name",
            ""
        )
    ).strip()


    quantity = data.get(
        "quantity"
    )


    food_type = str(
        data.get(
            "food_type",
            ""
        )
    ).strip()


    pickup_time = str(
        data.get(
            "pickup_time",
            ""
        )
    ).strip()


    latitude = data.get(
        "latitude"
    )


    longitude = data.get(
        "longitude"
    )


    address = str(
        data.get(
            "address",
            ""
        )
    ).strip()


    # ========================================================
    # VALIDATION
    # ========================================================

    if not food_name:

        return jsonify({
            "error":
                "Food name is required."
        }), 400


    if quantity is None:

        return jsonify({
            "error":
                "Quantity is required."
        }), 400


    try:

        quantity = int(quantity)

    except (
        TypeError,
        ValueError
    ):

        return jsonify({
            "error":
                "Quantity must be a number."
        }), 400


    if quantity <= 0:

        return jsonify({
            "error":
                "Quantity must be greater than zero."
        }), 400


    conn = get_db_connection()


    try:

        # ====================================================
        # IF DONOR ID IS PROVIDED
        # VERIFY USER
        # ====================================================

        if donor_id is not None:

            try:

                donor_id = int(
                    donor_id
                )

            except (
                TypeError,
                ValueError
            ):

                return jsonify({
                    "error":
                        "Invalid donor ID."
                }), 400


            donor = conn.execute(
                """
                SELECT
                    id,
                    name,
                    role

                FROM users

                WHERE id = ?
                """,

                (donor_id,)
            ).fetchone()


            if not donor:

                return jsonify({
                    "error":
                        "Donor account not found."
                }), 404


            if donor["role"].upper() != "DONOR":

                return jsonify({
                    "error":
                        "Selected user is not a donor."
                }), 400


            # Use the actual registered name

            donor_name = donor["name"]


        else:

            # =================================================
            # BACKWARD COMPATIBILITY
            # =================================================

            if not donor_name:

                return jsonify({
                    "error":
                        "Donor information is required."
                }), 400


            donor = conn.execute(
                """
                SELECT id

                FROM users

                WHERE LOWER(TRIM(name))
                    = LOWER(TRIM(?))

                AND UPPER(role) = 'DONOR'

                LIMIT 1
                """,

                (donor_name,)
            ).fetchone()


            if donor:

                donor_id = donor["id"]


        # ====================================================
        # CREATE DONATION
        # ====================================================

        created_at = datetime.now().isoformat()


        cursor = conn.execute(
            """
            INSERT INTO donations (

                donor_id,
                donor_name,
                food_name,
                quantity,
                food_type,
                pickup_time,
                latitude,
                longitude,
                address,
                status,
                created_at

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,

            (
                donor_id,
                donor_name,
                food_name,
                quantity,
                food_type,
                pickup_time,
                latitude,
                longitude,
                address,
                "Available",
                created_at
            )

        )


        donation_id = cursor.lastrowid


        conn.commit()


        return jsonify({

            "message":
                "Donation created successfully.",

            "donation_id":
                donation_id,

            "donation": {

                "id":
                    donation_id,

                "donor_id":
                    donor_id,

                "donor_name":
                    donor_name,

                "food_name":
                    food_name,

                "quantity":
                    quantity,

                "food_type":
                    food_type,

                "pickup_time":
                    pickup_time,

                "latitude":
                    latitude,

                "longitude":
                    longitude,

                "address":
                    address,

                "status":
                    "Available",

                "created_at":
                    created_at

            }

        }), 201


    except Exception as error:

        conn.rollback()

        print(
            "CREATE DONATION ERROR:",
            error
        )

        return jsonify({
            "error":
                "Unable to create donation.",
            "details":
                str(error)
        }), 500


    finally:

        conn.close()


# ============================================================
# GET ALL DONATIONS
# ============================================================

@app.route(
    "/api/donations",
    methods=["GET"]
)
def get_all_donations():

    conn = get_db_connection()


    try:

        donations = conn.execute(
            """
            SELECT

                id,
                donor_id,
                donor_name,
                food_name,
                quantity,
                food_type,
                pickup_time,
                latitude,
                longitude,
                address,
                status,
                created_at

            FROM donations

            ORDER BY id DESC
            """
        ).fetchall()


        return jsonify([

            row_to_dict(
                donation
            )

            for donation in donations

        ])


    finally:

        conn.close()


# ============================================================
# GET AVAILABLE DONATIONS
# ============================================================

@app.route(
    "/api/donations/available",
    methods=["GET"]
)
def get_available_donations():

    conn = get_db_connection()


    try:

        donations = conn.execute(
            """
            SELECT

                id,
                donor_id,
                donor_name,
                food_name,
                quantity,
                food_type,
                pickup_time,
                latitude,
                longitude,
                address,
                status,
                created_at

            FROM donations

            WHERE status = 'Available'

            ORDER BY id DESC
            """
        ).fetchall()


        return jsonify([

            row_to_dict(
                donation
            )

            for donation in donations

        ])


    finally:

        conn.close()


# ============================================================
# GET DONATIONS BY DONOR NAME
#
# KEPT FOR BACKWARD COMPATIBILITY
# ============================================================

@app.route(
    "/api/donations/donor/<path:donor_name>",
    methods=["GET"]
)
def get_donor_donations(
    donor_name
):

    conn = get_db_connection()


    try:

        donations = conn.execute(
            """
            SELECT

                id,
                donor_id,
                donor_name,
                food_name,
                quantity,
                food_type,
                pickup_time,
                latitude,
                longitude,
                address,
                status,
                created_at

            FROM donations

            WHERE LOWER(TRIM(donor_name))
                = LOWER(TRIM(?))

            ORDER BY id DESC
            """,

            (donor_name,)
        ).fetchall()


        return jsonify([

            row_to_dict(
                donation
            )

            for donation in donations

        ])


    finally:

        conn.close()


# ============================================================
# GET DONATIONS BY DONOR ID
#
# THIS IS THE IMPORTANT NEW ROUTE
# ============================================================

@app.route(
    "/api/donations/donor-id/<int:donor_id>",
    methods=["GET"]
)
def get_donor_donations_by_id(
    donor_id
):

    conn = get_db_connection()


    try:

        # ====================================================
        # VERIFY DONOR
        # ====================================================

        donor = conn.execute(
            """
            SELECT
                id,
                name,
                email,
                role

            FROM users

            WHERE id = ?
            """,

            (donor_id,)
        ).fetchone()


        if not donor:

            return jsonify({
                "error":
                    "Donor not found."
            }), 404


        if donor["role"].upper() != "DONOR":

            return jsonify({
                "error":
                    "User is not a donor."
            }), 400


        # ====================================================
        # GET DONATIONS
        # ====================================================

        donations = conn.execute(
            """
            SELECT

                id,
                donor_id,
                donor_name,
                food_name,
                quantity,
                food_type,
                pickup_time,
                latitude,
                longitude,
                address,
                status,
                created_at

            FROM donations

            WHERE donor_id = ?

            ORDER BY id DESC
            """,

            (donor_id,)
        ).fetchall()


        return jsonify([

            row_to_dict(
                donation
            )

            for donation in donations

        ])


    finally:

        conn.close()


# ============================================================
# GET SINGLE DONATION
# ============================================================

@app.route(
    "/api/donations/<int:donation_id>",
    methods=["GET"]
)
def get_single_donation(
    donation_id
):

    conn = get_db_connection()


    try:

        donation = conn.execute(
            """
            SELECT

                id,
                donor_id,
                donor_name,
                food_name,
                quantity,
                food_type,
                pickup_time,
                latitude,
                longitude,
                address,
                status,
                created_at

            FROM donations

            WHERE id = ?
            """,

            (donation_id,)
        ).fetchone()


        if not donation:

            return jsonify({
                "error":
                    "Donation not found."
            }), 404


        return jsonify(
            row_to_dict(
                donation
            )
        )


    finally:

        conn.close()


# ============================================================
# ACCEPT DONATION
# ============================================================

@app.route(
    "/api/donations/<int:donation_id>/accept",
    methods=["PUT"]
)
def accept_donation(
    donation_id
):

    conn = get_db_connection()


    try:

        donation = conn.execute(
            """
            SELECT
                id,
                status

            FROM donations

            WHERE id = ?
            """,

            (donation_id,)
        ).fetchone()


        if not donation:

            return jsonify({
                "error":
                    "Donation not found."
            }), 404


        if donation["status"] != "Available":

            return jsonify({

                "error":
                    "Only available donations can be accepted.",

                "current_status":
                    donation["status"]

            }), 400


        conn.execute(
            """
            UPDATE donations

            SET status = 'Accepted'

            WHERE id = ?
            """,

            (donation_id,)
        )


        conn.commit()


        return jsonify({

            "message":
                "Donation accepted successfully.",

            "donation_id":
                donation_id,

            "status":
                "Accepted"

        })


    finally:

        conn.close()


# ============================================================
# MARK DONATION AS COLLECTED
# ============================================================

@app.route(
    "/api/donations/<int:donation_id>/collected",
    methods=["PUT"]
)
def mark_donation_collected(
    donation_id
):

    conn = get_db_connection()


    try:

        donation = conn.execute(
            """
            SELECT
                id,
                status

            FROM donations

            WHERE id = ?
            """,

            (donation_id,)
        ).fetchone()


        if not donation:

            return jsonify({
                "error":
                    "Donation not found."
            }), 404


        if donation["status"] != "Accepted":

            return jsonify({

                "error":
                    "Only accepted donations can be marked as collected.",

                "current_status":
                    donation["status"]

            }), 400


        conn.execute(
            """
            UPDATE donations

            SET status = 'Collected'

            WHERE id = ?
            """,

            (donation_id,)
        )


        conn.commit()


        return jsonify({

            "message":
                "Donation marked as collected successfully.",

            "donation_id":
                donation_id,

            "status":
                "Collected"

        })


    finally:

        conn.close()


# ============================================================
# GET NEAREST NGO
# ============================================================

@app.route(
    "/api/donations/<int:donation_id>/nearest-ngo",
    methods=["GET"]
)
def nearest_ngo(
    donation_id
):

    conn = get_db_connection()


    try:

        donation = conn.execute(
            """
            SELECT
                id,
                latitude,
                longitude

            FROM donations

            WHERE id = ?
            """,

            (donation_id,)
        ).fetchone()


        if not donation:

            return jsonify({
                "error":
                    "Donation not found."
            }), 404


        if (
            donation["latitude"] is None
            or
            donation["longitude"] is None
        ):

            return jsonify({
                "error":
                    "Donation location is not available."
            }), 400


        ngos = conn.execute(
            """
            SELECT

                id,
                name,
                contact,
                latitude,
                longitude,
                address

            FROM ngos

            WHERE latitude IS NOT NULL

            AND longitude IS NOT NULL
            """
        ).fetchall()


        if not ngos:

            return jsonify({
                "message":
                    "No NGOs with location data found."
            }), 404


        nearest = None

        nearest_distance = None


        for ngo in ngos:

            distance = calculate_distance(

                donation["latitude"],

                donation["longitude"],

                ngo["latitude"],

                ngo["longitude"]

            )


            if distance is None:

                continue


            if (
                nearest_distance is None
                or
                distance < nearest_distance
            ):

                nearest_distance = distance

                nearest = ngo


        if nearest is None:

            return jsonify({
                "error":
                    "Unable to calculate nearest NGO."
            }), 404


        result = row_to_dict(
            nearest
        )


        result["distance_km"] = round(
            nearest_distance,
            2
        )


        return jsonify(
            result
        )


    finally:

        conn.close()


# ============================================================
# CREATE NGO
# ============================================================

@app.route(
    "/api/ngos",
    methods=["POST"]
)
def create_ngo():

    data = request.get_json()


    if not data:

        return jsonify({
            "error":
                "No NGO data received."
        }), 400


    name = str(
        data.get(
            "name",
            ""
        )
    ).strip()


    contact = str(
        data.get(
            "contact",
            ""
        )
    ).strip()


    latitude = data.get(
        "latitude"
    )


    longitude = data.get(
        "longitude"
    )


    address = str(
        data.get(
            "address",
            ""
        )
    ).strip()


    if not name:

        return jsonify({
            "error":
                "NGO name is required."
        }), 400


    conn = get_db_connection()


    try:

        cursor = conn.execute(
            """
            INSERT INTO ngos (

                name,
                contact,
                latitude,
                longitude,
                address

            )

            VALUES (?, ?, ?, ?, ?)
            """,

            (
                name,
                contact,
                latitude,
                longitude,
                address
            )

        )


        conn.commit()


        return jsonify({

            "message":
                "NGO created successfully.",

            "ngo_id":
                cursor.lastrowid

        }), 201


    finally:

        conn.close()


# ============================================================
# GET ALL NGOS
# ============================================================

@app.route(
    "/api/ngos",
    methods=["GET"]
)
def get_ngos():

    conn = get_db_connection()


    try:

        ngos = conn.execute(
            """
            SELECT

                id,
                name,
                contact,
                latitude,
                longitude,
                address

            FROM ngos

            ORDER BY id DESC
            """
        ).fetchall()


        return jsonify([

            row_to_dict(
                ngo
            )

            for ngo in ngos

        ])


    finally:

        conn.close()


# ============================================================
# GET NGO BY NAME
# ============================================================

@app.route(
    "/api/ngos/<path:ngo_name>",
    methods=["GET"]
)
def get_ngo_by_name(
    ngo_name
):

    conn = get_db_connection()


    try:

        ngo = conn.execute(
            """
            SELECT

                id,
                name,
                contact,
                latitude,
                longitude,
                address

            FROM ngos

            WHERE LOWER(TRIM(name))
                = LOWER(TRIM(?))

            LIMIT 1
            """,

            (ngo_name,)
        ).fetchone()


        if not ngo:

            return jsonify({
                "error":
                    "NGO not found."
            }), 404


        return jsonify(
            row_to_dict(
                ngo
            )
        )


    finally:

        conn.close()


# ============================================================
# INITIALIZE DATABASE
# ============================================================

if __name__ == "__main__":

    print(
        "============================================"
    )

    print(
        "FOODCONNECT BACKEND"
    )

    print(
        "============================================"
    )

    print(
        "Database:",
        DATABASE
    )


    init_db()


    # ========================================================
    # SHOW DATABASE SUMMARY
    # ========================================================

    conn = get_db_connection()


    try:

        total_users = conn.execute(
            "SELECT COUNT(*) AS count FROM users"
        ).fetchone()["count"]


        total_donations = conn.execute(
            "SELECT COUNT(*) AS count FROM donations"
        ).fetchone()["count"]


        linked_donations = conn.execute(
            """
            SELECT COUNT(*) AS count

            FROM donations

            WHERE donor_id IS NOT NULL
            """
        ).fetchone()["count"]


        print(
            "Total users:",
            total_users
        )


        print(
            "Total donations:",
            total_donations
        )


        print(
            "Donations linked to donors:",
            linked_donations
        )


    finally:

        conn.close()


    print(
        "============================================"
    )

    print(
        "Starting Flask server..."
    )

    print(
        "============================================"
    )


    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )