// ============================================================
// FOODCONNECT - DONOR DASHBOARD
// COMPLETE DONOR DASHBOARD JAVASCRIPT
// ============================================================


// ============================================================
// API CONFIGURATION
// ============================================================

const API_URL = "http://127.0.0.1:5000";


// ============================================================
// GET LOGGED-IN USER
// ============================================================

const storedUser = localStorage.getItem("user");

if (!storedUser) {

    alert("Please login first.");

    window.location.href = "login.html";

    throw new Error("User not logged in.");

}


// ============================================================
// PARSE USER
// ============================================================

let user;

try {

    user = JSON.parse(storedUser);

}

catch (error) {

    console.error("Invalid user data:", error);

    localStorage.removeItem("user");

    alert("Session expired. Please login again.");

    window.location.href = "login.html";

    throw new Error("Invalid user data.");

}


// ============================================================
// CHECK DONOR ROLE
// ============================================================

if (
    !user.role ||
    user.role.toUpperCase() !== "DONOR"
) {

    alert("Access denied. Donor account required.");

    localStorage.removeItem("user");

    window.location.href = "login.html";

    throw new Error("Not a donor account.");

}


// ============================================================
// DISPLAY DONOR NAME
// ============================================================

const donorNameElement =
    document.getElementById("donorName");

if (donorNameElement) {

    donorNameElement.textContent = user.name;

}


// ============================================================
// DISPLAY DONOR EMAIL
// ============================================================

const donorEmailElement =
    document.getElementById("donorEmail");

if (donorEmailElement) {

    donorEmailElement.textContent = user.email;

}


// ============================================================
// DEBUG INFORMATION
// ============================================================

console.log("====================================");
console.log("FOODCONNECT DONOR DASHBOARD");
console.log("====================================");
console.log("Logged-in user:", user);
console.log("Donor ID:", user.id);
console.log("Donor Name:", user.name);
console.log("Donor Email:", user.email);
console.log("Donor Role:", user.role);
console.log("====================================");


// ============================================================
// LOAD DONOR DONATIONS
// ============================================================

async function loadDonations() {

    const debugMessage =
        document.getElementById("debugMessage");

    try {

        if (debugMessage) {

            debugMessage.textContent =
                "Loading your donation history...";

        }


        console.log(
            "Loading donations for donor ID:",
            user.id
        );


        const requestURL =
            `${API_URL}/api/donations/donor-id/${user.id}`;


        console.log(
            "REQUEST URL:",
            requestURL
        );


        const response =
            await fetch(requestURL);


        console.log(
            "HTTP STATUS:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "HTTP " + response.status
            );

        }


        const donations =
            await response.json();


        console.log(
            "DONATIONS RECEIVED:",
            donations
        );


        if (debugMessage) {

            debugMessage.textContent =
                "✓ Connected successfully • " +
                donations.length +
                " donation(s) found";

        }


        // Update statistics

        updateStatistics(donations);


        // Display donation cards

        displayDonations(donations);

    }

    catch (error) {

        console.error(
            "Error loading donations:",
            error
        );


        if (debugMessage) {

            debugMessage.textContent =
                "❌ Unable to load donations. " +
                error.message;

        }


        showDonationError();

    }

}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics(donations) {

    const total =
        donations.length;


    const active =
        donations.filter(
            function (donation) {

                return (
                    donation.status === "Available" ||
                    donation.status === "Accepted"
                );

            }
        ).length;


    const completed =
        donations.filter(
            function (donation) {

                return (
                    donation.status === "Collected"
                );

            }
        ).length;


    const totalElement =
        document.getElementById(
            "totalDonations"
        );


    const activeElement =
        document.getElementById(
            "activeDonations"
        );


    const completedElement =
        document.getElementById(
            "completedDonations"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (activeElement) {

        activeElement.textContent =
            active;

    }


    if (completedElement) {

        completedElement.textContent =
            completed;

    }


    console.log(
        "Statistics:",
        {
            total: total,
            active: active,
            completed: completed
        }
    );

}


// ============================================================
// DISPLAY DONATIONS
// IMPORTANT:
// Your HTML uses id="myDonations"
// ============================================================

function displayDonations(donations) {

    const donationList =
        document.getElementById(
            "myDonations"
        );


    if (!donationList) {

        console.error(
            "myDonations element not found in HTML."
        );

        return;

    }


    // ========================================================
    // NO DONATIONS
    // ========================================================

    if (donations.length === 0) {

        donationList.innerHTML = `

            <div class="empty-message">

                <p>
                    🍱 You have not posted any
                    food donations yet.
                </p>

                <p>
                    Your donations will appear
                    here after you post them.
                </p>

            </div>

        `;

        return;

    }


    // ========================================================
    // CLEAR PREVIOUS CONTENT
    // ========================================================

    donationList.innerHTML = "";


    // ========================================================
    // CREATE DONATION CARDS
    // ========================================================

    donations.forEach(
        function (donation) {

            const card =
                document.createElement("div");


            card.className =
                "donation-item";


            // =================================================
            // STATUS
            // =================================================

            let statusText =
                "🟡 Available";


            let statusClass =
                "available";


            if (
                donation.status === "Accepted"
            ) {

                statusText =
                    "🤝 Accepted";

                statusClass =
                    "accepted";

            }


            else if (
                donation.status === "Collected"
            ) {

                statusText =
                    "✓ Collected";

                statusClass =
                    "collected";

            }


            // =================================================
            // CARD HTML
            // =================================================

            card.innerHTML = `

                <div class="donation-header">

                    <h3>
                        🍱
                        ${escapeHTML(
                donation.food_name
            )}
                    </h3>

                    <span class="status ${statusClass}">
                        ${statusText}
                    </span>

                </div>


                <div class="donation-details">

                    <p>

                        <strong>
                            📦 Quantity:
                        </strong>

                        ${escapeHTML(
                String(
                    donation.quantity
                )
            )}

                    </p>


                    <p>

                        <strong>
                            🥗 Food Type:
                        </strong>

                        ${escapeHTML(
                donation.food_type ||
                "Not specified"
            )}

                    </p>


                    <p>

                        <strong>
                            🕐 Pickup:
                        </strong>

                        ${escapeHTML(
                donation.pickup_time ||
                "Not specified"
            )}

                    </p>


                    <p>

                        <strong>
                            📍 Address:
                        </strong>

                        ${escapeHTML(
                donation.address ||
                "Not specified"
            )}

                    </p>


                    <p>

                        <strong>
                            📅 Posted:
                        </strong>

                        ${formatDate(
                donation.created_at
            )}

                    </p>

                </div>

            `;


            donationList.appendChild(card);

        }
    );

}


// ============================================================
// SHOW DONATION ERROR
// ============================================================

function showDonationError() {

    const donationList =
        document.getElementById(
            "myDonations"
        );


    if (donationList) {

        donationList.innerHTML = `

            <div class="empty-message">

                <p>
                    ❌ Unable to load your donations.
                </p>

                <p>
                    Please make sure the Flask
                    server is running.
                </p>

            </div>

        `;

    }

}


// ============================================================
// GET DONATION LOCATION
// ============================================================

function getDonationLocation() {

    const locationStatus =
        document.getElementById(
            "locationStatus"
        );


    if (!navigator.geolocation) {

        if (locationStatus) {

            locationStatus.textContent =
                "❌ Geolocation is not supported.";

        }

        return;

    }


    if (locationStatus) {

        locationStatus.textContent =
            "📍 Getting your location...";

    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            const latitudeElement =
                document.getElementById(
                    "latitude"
                );


            const longitudeElement =
                document.getElementById(
                    "longitude"
                );


            if (latitudeElement) {

                latitudeElement.value =
                    latitude;

            }


            if (longitudeElement) {

                longitudeElement.value =
                    longitude;

            }


            // Update local user information

            user.latitude =
                latitude;

            user.longitude =
                longitude;


            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );


            if (locationStatus) {

                locationStatus.textContent =
                    "✓ Location captured successfully.";

            }


            console.log(
                "Location captured:",
                latitude,
                longitude
            );

        },


        function (error) {

            console.error(
                "Location error:",
                error
            );


            if (locationStatus) {

                locationStatus.textContent =
                    "❌ Unable to get location.";

            }

        },


        {

            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0

        }

    );

}


// ============================================================
// POST DONATION
// ============================================================

async function postDonation() {

    const foodNameElement =
        document.getElementById(
            "foodName"
        );


    const quantityElement =
        document.getElementById(
            "quantity"
        );


    const foodTypeElement =
        document.getElementById(
            "foodType"
        );


    const pickupTimeElement =
        document.getElementById(
            "pickupTime"
        );


    const addressElement =
        document.getElementById(
            "address"
        );


    const latitudeElement =
        document.getElementById(
            "latitude"
        );


    const longitudeElement =
        document.getElementById(
            "longitude"
        );


    const message =
        document.getElementById(
            "donationMessage"
        );


    // ========================================================
    // GET VALUES
    // ========================================================

    const foodName =
        foodNameElement ?
            foodNameElement.value.trim() :
            "";


    const quantity =
        quantityElement ?
            quantityElement.value :
            "";


    const foodType =
        foodTypeElement ?
            foodTypeElement.value :
            "";


    const pickupTime =
        pickupTimeElement ?
            pickupTimeElement.value :
            "";


    const address =
        addressElement ?
            addressElement.value.trim() :
            "";


    const latitude =
        latitudeElement ?
            latitudeElement.value :
            "";


    const longitude =
        longitudeElement ?
            longitudeElement.value :
            "";


    // ========================================================
    // VALIDATION
    // ========================================================

    if (
        !foodName ||
        !quantity ||
        !foodType ||
        !pickupTime
    ) {

        if (message) {

            message.textContent =
                "❌ Please complete all required fields.";

        }

        return;

    }


    if (
        !latitude ||
        !longitude
    ) {

        if (message) {

            message.textContent =
                "❌ Please select your current location first.";

        }

        return;

    }


    // ========================================================
    // DONATION DATA
    // ========================================================

    const donationData = {

        donor_id:
            user.id,

        donor_name:
            user.name,

        food_name:
            foodName,

        quantity:
            Number(quantity),

        food_type:
            foodType,

        pickup_time:
            pickupTime,

        latitude:
            Number(latitude),

        longitude:
            Number(longitude),

        address:
            address

    };


    console.log(
        "Posting donation:",
        donationData
    );


    try {

        if (message) {

            message.textContent =
                "Posting your donation...";

        }


        const response =
            await fetch(
                `${API_URL}/api/donations`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            donationData
                        )

                }
            );


        const result =
            await response.json();


        console.log(
            "Donation response:",
            result
        );


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Donation failed."
            );

        }


        if (message) {

            message.textContent =
                "✓ Food donation posted successfully!";

        }


        // ====================================================
        // CLEAR FORM
        // ====================================================

        clearDonationForm();


        // ====================================================
        // RELOAD DONATIONS
        // ====================================================

        await loadDonations();

    }


    catch (error) {

        console.error(
            "Post donation error:",
            error
        );


        if (message) {

            message.textContent =
                "❌ " +
                error.message;

        }

    }

}


// ============================================================
// CLEAR DONATION FORM
// ============================================================

function clearDonationForm() {

    const form =
        document.getElementById(
            "donationForm"
        );


    if (form) {

        form.reset();

    }


    const latitude =
        document.getElementById(
            "latitude"
        );


    const longitude =
        document.getElementById(
            "longitude"
        );


    if (latitude) {

        latitude.value = "";

    }


    if (longitude) {

        longitude.value = "";

    }


    const locationStatus =
        document.getElementById(
            "locationStatus"
        );


    if (locationStatus) {

        locationStatus.textContent =
            "📍 Location not selected";

    }

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateString) {

    if (!dateString) {

        return "Not specified";

    }


    try {

        const date =
            new Date(dateString);


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return escapeHTML(
                String(dateString)
            );

        }


        return escapeHTML(
            date.toLocaleString()
        );

    }

    catch (error) {

        return escapeHTML(
            String(dateString)
        );

    }

}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;

}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    localStorage.removeItem(
        "user"
    );


    window.location.href =
        "login.html";

}


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.postDonation =
    postDonation;


window.logout =
    logout;


window.getDonationLocation =
    getDonationLocation;


// ============================================================
// FORM SUBMISSION
// ============================================================

const donationForm =
    document.getElementById(
        "donationForm"
    );


if (donationForm) {

    donationForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            postDonation();

        }
    );

}


// ============================================================
// START DASHBOARD
// ============================================================

loadDonations();