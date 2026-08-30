const API_URL = "http://127.0.0.1:5000";


async function loadDonations() {

    const container =
        document.getElementById(
            "donationList"
        );


    try {

        const response =
            await fetch(
                `${API_URL}/api/donations`
            );


        const donations =
            await response.json();


        container.innerHTML = "";


        if (donations.length === 0) {

            container.innerHTML =
                "<p>No food donations available right now.</p>";

            return;
        }


        donations.forEach(donation => {

            const card =
                document.createElement("div");


            card.className =
                "donation-card";


            card.innerHTML = `

                <h2>
                    ${donation.food_name}
                </h2>

                <p>
                    <strong>Donor:</strong>
                    ${donation.donor_name}
                </p>

                <p>
                    <strong>Quantity:</strong>
                    ${donation.quantity} meals
                </p>

                <p>
                    <strong>Food Type:</strong>
                    ${donation.food_type || "Not specified"}
                </p>

                <p>
                    <strong>Pickup:</strong>
                    ${donation.pickup_time || "Flexible"}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${donation.address}
                </p>

                <button
                    onclick="acceptDonation(${donation.id})">

                    Accept Donation

                </button>

                <button
                    onclick="findNearestNGO(${donation.id})">

                    📍 Find Nearest NGO

                </button>

                <p id="ngo-${donation.id}"></p>

            `;


            container.appendChild(card);

        });

    } catch (error) {

        console.error(error);

        container.innerHTML =
            "Unable to load donations.";

    }
}


// --------------------------------
// ACCEPT DONATION
// --------------------------------

async function acceptDonation(id) {

    const response =
        await fetch(
            `${API_URL}/api/donations/${id}/accept`,
            {
                method: "PUT"
            }
        );


    const result =
        await response.json();


    alert(result.message || result.error);


    loadDonations();
}


// --------------------------------
// FIND NEAREST NGO
// --------------------------------

async function findNearestNGO(id) {

    const response =
        await fetch(
            `${API_URL}/api/donations/${id}/nearest-ngo`
        );


    const result =
        await response.json();


    const element =
        document.getElementById(
            `ngo-${id}`
        );


    if (result.error) {

        element.innerText =
            result.error;

        return;
    }


    element.innerHTML = `

        <strong>
            Nearest NGO:
        </strong>

        ${result.name}

        <br>

        Distance:
        ${result.distance_km} km

        <br>

        Contact:
        ${result.contact}

    `;
}


loadDonations();