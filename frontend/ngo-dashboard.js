// ============================================================
// FOODCONNECT - NGO DASHBOARD
// COMPLETE NGO DASHBOARD JAVASCRIPT
// ============================================================


// ============================================================
// BACKEND URL
// ============================================================

const API_URL = "https://smart-food-donation-o4yh.onrender.com";


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
// GET USER DATA SAFELY
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
// CHECK NGO ROLE
// ============================================================

if (
    !user.role ||
    user.role.toUpperCase() !== "NGO"
) {

    alert("Access denied. NGO account required.");

    localStorage.removeItem("user");

    window.location.href = "login.html";

    throw new Error("Not an NGO account.");

}


// ============================================================
// DISPLAY NGO NAME
// ============================================================

const ngoNameElement =
    document.getElementById("ngoName");


if (ngoNameElement) {

    ngoNameElement.textContent =
        user.name || "NGO";

}


// ============================================================
// DEBUG INFORMATION
// ============================================================

console.log("====================================");
console.log("FOODCONNECT NGO DASHBOARD");
console.log("====================================");
console.log("Logged-in user:", user);
console.log("NGO ID:", user.id);
console.log("NGO Name:", user.name);
console.log("NGO Email:", user.email);
console.log("NGO Role:", user.role);
console.log("====================================");


// ============================================================
// LOAD ALL DONATIONS
// ============================================================

async function loadDonations() {

    try {

        console.log("Loading donations...");


        const response = await fetch(
            `${API_URL}/api/donations`
        );


        if (!response.ok) {

            throw new Error(
                "Unable to load donations. Server returned " +
                response.status
            );

        }


        const donations =
            await response.json();


        console.log(
            "Donations received:",
            donations
        );


        // ====================================================
        // UPDATE STATISTICS
        // ====================================================

        updateStatistics(donations);


        // ====================================================
        // DISPLAY DONATIONS
        // ====================================================

        displayAvailableDonations(
            donations
        );


        displayAcceptedDonations(
            donations
        );


        displayCollectedDonations(
            donations
        );

    }


    catch (error) {

        console.error(
            "Error loading donations:",
            error
        );


        showLoadingError();

    }

}


// ============================================================
// UPDATE STATISTICS
// ============================================================

function updateStatistics(donations) {


    // ========================================================
    // AVAILABLE
    // ========================================================

    const available =
        donations.filter(
            donation =>
                donation.status === "Available"
        ).length;


    // ========================================================
    // ACCEPTED
    // ========================================================

    const accepted =
        donations.filter(
            donation =>
                donation.status === "Accepted"
        ).length;


    // ========================================================
    // COLLECTED
    // ========================================================

    const collected =
        donations.filter(
            donation =>
                donation.status === "Collected"
        ).length;


    // ========================================================
    // UPDATE HTML
    // ========================================================

    const availableCount =
        document.getElementById(
            "availableCount"
        );


    const acceptedCount =
        document.getElementById(
            "acceptedCount"
        );


    const collectedCount =
        document.getElementById(
            "collectedCount"
        );


    if (availableCount) {

        availableCount.textContent =
            available;

    }


    if (acceptedCount) {

        acceptedCount.textContent =
            accepted;

    }


    if (collectedCount) {

        collectedCount.textContent =
            collected;

    }


    console.log(
        "Statistics:",
        {
            available,
            accepted,
            collected
        }
    );

}


// ============================================================
// DISPLAY AVAILABLE DONATIONS
// ============================================================

function displayAvailableDonations(
    donations
) {


    const donationList =
        document.getElementById(
            "availableDonationList"
        );


    if (!donationList) {

        console.warn(
            "availableDonationList not found."
        );

        return;

    }


    // ========================================================
    // FILTER AVAILABLE DONATIONS
    // ========================================================

    const availableDonations =
        donations.filter(
            donation =>
                donation.status === "Available"
        );


    // ========================================================
    // EMPTY STATE
    // ========================================================

    if (
        availableDonations.length === 0
    ) {

        donationList.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🍲
                </div>

                <h3>
                    No food available right now
                </h3>

                <p>
                    New food donations from donors
                    will appear here.
                </p>

            </div>

        `;

        return;

    }


    // ========================================================
    // CLEAR LIST
    // ========================================================

    donationList.innerHTML = "";


    // ========================================================
    // CREATE DONATION CARDS
    // ========================================================

    availableDonations.forEach(
        function (donation) {

            const card =
                document.createElement("div");


            card.className =
                "donation-card";


            card.innerHTML = `

                <div class="donation-header">

                    <h3>
                        🍱
                        ${escapeHTML(
                donation.food_name ||
                "Food Donation"
            )}
                    </h3>

                    <span class="status available">
                        Available
                    </span>

                </div>


                <div class="donation-details">

                    <p>
                        <strong>👤 Donor:</strong>
                        ${escapeHTML(
                donation.donor_name ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>📦 Quantity:</strong>
                        ${escapeHTML(
                String(
                    donation.quantity ||
                    "Not specified"
                )
            )}
                    </p>


                    <p>
                        <strong>🍴 Food Type:</strong>
                        ${escapeHTML(
                donation.food_type ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>🕐 Pickup Time:</strong>
                        ${escapeHTML(
                donation.pickup_time ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>📍 Address:</strong>
                        ${escapeHTML(
                donation.address ||
                "Not specified"
            )}
                    </p>

                </div>


                <div class="donation-actions">

                    <button
                        type="button"
                        class="accept-btn"
                        onclick="acceptDonation(${donation.id})"
                    >
                        🤝 Accept Donation
                    </button>

                </div>

            `;


            donationList.appendChild(card);

        }
    );

}


// ============================================================
// DISPLAY ACCEPTED DONATIONS
// ============================================================

function displayAcceptedDonations(
    donations
) {


    const donationList =
        document.getElementById(
            "acceptedDonationList"
        );


    if (!donationList) {

        console.warn(
            "acceptedDonationList not found."
        );

        return;

    }


    // ========================================================
    // FILTER ACCEPTED
    // ========================================================

    const acceptedDonations =
        donations.filter(
            donation =>
                donation.status === "Accepted"
        );


    // ========================================================
    // EMPTY STATE
    // ========================================================

    if (
        acceptedDonations.length === 0
    ) {

        donationList.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    🤝
                </div>

                <h3>
                    No accepted donations yet
                </h3>

                <p>
                    Food donations that you accept
                    will appear here.
                </p>

            </div>

        `;

        return;

    }


    // ========================================================
    // CLEAR LIST
    // ========================================================

    donationList.innerHTML = "";


    // ========================================================
    // CREATE ACCEPTED CARDS
    // ========================================================

    acceptedDonations.forEach(
        function (donation) {

            const card =
                document.createElement("div");


            card.className =
                "donation-card";


            card.innerHTML = `

                <div class="donation-header">

                    <h3>
                        🍱
                        ${escapeHTML(
                donation.food_name ||
                "Food Donation"
            )}
                    </h3>

                    <span class="status accepted">
                        Accepted
                    </span>

                </div>


                <div class="donation-details">

                    <p>
                        <strong>👤 Donor:</strong>
                        ${escapeHTML(
                donation.donor_name ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>📦 Quantity:</strong>
                        ${escapeHTML(
                String(
                    donation.quantity ||
                    "Not specified"
                )
            )}
                    </p>


                    <p>
                        <strong>🍴 Food Type:</strong>
                        ${escapeHTML(
                donation.food_type ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>🕐 Pickup Time:</strong>
                        ${escapeHTML(
                donation.pickup_time ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>📍 Address:</strong>
                        ${escapeHTML(
                donation.address ||
                "Not specified"
            )}
                    </p>

                </div>


                <div class="donation-actions">

                    <button
                        type="button"
                        class="collect-btn"
                        onclick="markAsCollected(${donation.id})"
                    >
                        ✅ Mark as Collected
                    </button>

                </div>

            `;


            donationList.appendChild(card);

        }
    );

}


// ============================================================
// DISPLAY COLLECTED DONATIONS
// ============================================================

function displayCollectedDonations(
    donations
) {


    const donationList =
        document.getElementById(
            "collectedDonationList"
        );


    if (!donationList) {

        console.warn(
            "collectedDonationList not found."
        );

        return;

    }


    // ========================================================
    // FILTER COLLECTED
    // ========================================================

    const collectedDonations =
        donations.filter(
            donation =>
                donation.status === "Collected"
        );


    // ========================================================
    // EMPTY STATE
    // ========================================================

    if (
        collectedDonations.length === 0
    ) {

        donationList.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ✅
                </div>

                <h3>
                    No donations collected yet
                </h3>

                <p>
                    Donations successfully collected
                    by your NGO will appear here.
                </p>

            </div>

        `;

        return;

    }


    // ========================================================
    // CLEAR LIST
    // ========================================================

    donationList.innerHTML = "";


    // ========================================================
    // CREATE COLLECTED CARDS
    // ========================================================

    collectedDonations.forEach(
        function (donation) {

            const card =
                document.createElement("div");


            card.className =
                "donation-card";


            card.innerHTML = `

                <div class="donation-header">

                    <h3>
                        🍱
                        ${escapeHTML(
                donation.food_name ||
                "Food Donation"
            )}
                    </h3>

                    <span class="status collected">
                        Collected
                    </span>

                </div>


                <div class="donation-details">

                    <p>
                        <strong>👤 Donor:</strong>
                        ${escapeHTML(
                donation.donor_name ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>📦 Quantity:</strong>
                        ${escapeHTML(
                String(
                    donation.quantity ||
                    "Not specified"
                )
            )}
                    </p>


                    <p>
                        <strong>🍴 Food Type:</strong>
                        ${escapeHTML(
                donation.food_type ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>📍 Address:</strong>
                        ${escapeHTML(
                donation.address ||
                "Not specified"
            )}
                    </p>


                    <p>
                        <strong>✅ Status:</strong>
                        Successfully Collected
                    </p>

                </div>

            `;


            donationList.appendChild(card);

        }
    );

}


// ============================================================
// ACCEPT DONATION
// ============================================================

async function acceptDonation(
    donationId
) {


    const confirmation =
        confirm(
            "Do you want to accept this food donation?"
        );


    if (!confirmation) {

        return;

    }


    try {

        console.log(
            "Accepting donation:",
            donationId
        );


        const response =
            await fetch(
                `${API_URL}/api/donations/${donationId}/accept`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        console.log(
            "Accept response:",
            data
        );


        if (response.ok) {

            alert(
                "Donation accepted successfully! 🤝"
            );


            await loadDonations();

        }
        else {

            alert(
                data.error ||
                "Unable to accept donation."
            );

        }

    }


    catch (error) {

        console.error(
            "Accept donation error:",
            error
        );


        alert(
            "Unable to connect to the FoodConnect server."
        );

    }

}


// ============================================================
// MARK DONATION AS COLLECTED
// ============================================================

async function markAsCollected(
    donationId
) {


    const confirmation =
        confirm(
            "Have you collected this food donation?"
        );


    if (!confirmation) {

        return;

    }


    try {

        console.log(
            "Marking donation as collected:",
            donationId
        );


        const response =
            await fetch(
                `${API_URL}/api/donations/${donationId}/collected`,
                {
                    method: "PUT"
                }
            );


        const data =
            await response.json();


        console.log(
            "Collection response:",
            data
        );


        if (response.ok) {

            alert(
                "Donation marked as collected! ✅"
            );


            await loadDonations();

        }
        else {

            alert(
                data.error ||
                "Unable to mark donation as collected."
            );

        }

    }


    catch (error) {

        console.error(
            "Collection error:",
            error
        );


        alert(
            "Unable to connect to the FoodConnect server."
        );

    }

}


// ============================================================
// SHOW LOADING / SERVER ERROR
// ============================================================

function showLoadingError() {


    const availableList =
        document.getElementById(
            "availableDonationList"
        );


    const acceptedList =
        document.getElementById(
            "acceptedDonationList"
        );


    const collectedList =
        document.getElementById(
            "collectedDonationList"
        );


    if (availableList) {

        availableList.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load donations
                </h3>

                <p>
                    Please make sure the FoodConnect
                    Flask server is running.
                </p>

            </div>

        `;

    }


    if (acceptedList) {

        acceptedList.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load donations
                </h3>

                <p>
                    Please check your server connection.
                </p>

            </div>

        `;

    }


    if (collectedList) {

        collectedList.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load donations
                </h3>

                <p>
                    Please check your server connection.
                </p>

            </div>

        `;

    }

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
// HTML ESCAPE
// ============================================================

function escapeHTML(
    value
) {


    const div =
        document.createElement("div");


    div.textContent =
        value;


    return div.innerHTML;

}


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO HTML
// ============================================================

window.acceptDonation =
    acceptDonation;


window.markAsCollected =
    markAsCollected;


window.logout =
    logout;


// ============================================================
// START NGO DASHBOARD
// ============================================================

loadDonations();