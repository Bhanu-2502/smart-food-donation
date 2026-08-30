const API_URL = "https://smart-food-donation-o4yh.onrender.com";


// Create map
const map = L.map("map").setView(
    [16.3067, 80.4365],
    13
);


// OpenStreetMap tiles
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            '&copy; OpenStreetMap contributors'
    }
).addTo(map);


// Load donations
async function loadDonations() {

    try {

        const response =
            await fetch(`${API_URL}/api/donations`);

        const donations =
            await response.json();


        donations.forEach(donation => {

            const marker =
                L.marker([
                    donation.latitude,
                    donation.longitude
                ]).addTo(map);


            marker.bindPopup(`
                <b>${donation.food_name}</b>
                <br>
                Donor: ${donation.donor_name}
                <br>
                Quantity: ${donation.quantity} meals
                <br>
                Type: ${donation.food_type || "Not specified"}
                <br>
                Status: ${donation.status}
            `);

        });

    } catch (error) {

        console.error(
            "Error loading donations:",
            error
        );

    }
}


loadDonations();