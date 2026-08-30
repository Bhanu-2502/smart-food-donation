const API_URL = "http://127.0.0.1:5000";


// --------------------------------
// GET USER LOCATION
// --------------------------------

function getLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported by your browser."
        );

        return;
    }


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            document.getElementById(
                "latitude"
            ).value = latitude;


            document.getElementById(
                "longitude"
            ).value = longitude;


            document.getElementById(
                "locationStatus"
            ).innerText =
                `Location captured: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

        },


        function (error) {

            alert(
                "Unable to get your location."
            );

            console.error(error);

        }

    );
}


// --------------------------------
// SUBMIT DONATION
// --------------------------------

document
    .getElementById("donationForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const donation = {

                donor_name:
                    document.getElementById(
                        "donor_name"
                    ).value,

                food_name:
                    document.getElementById(
                        "food_name"
                    ).value,

                quantity:
                    Number(
                        document.getElementById(
                            "quantity"
                        ).value
                    ),

                food_type:
                    document.getElementById(
                        "food_type"
                    ).value,

                pickup_time:
                    document.getElementById(
                        "pickup_time"
                    ).value,

                address:
                    document.getElementById(
                        "address"
                    ).value,

                latitude:
                    Number(
                        document.getElementById(
                            "latitude"
                        ).value
                    ),

                longitude:
                    Number(
                        document.getElementById(
                            "longitude"
                        ).value
                    )

            };


            if (
                !donation.latitude ||
                !donation.longitude
            ) {

                alert(
                    "Please select your location first."
                );

                return;
            }


            try {

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
                                JSON.stringify(donation)
                        }
                    );


                const result =
                    await response.json();


                if (response.ok) {

                    document.getElementById(
                        "message"
                    ).innerText =
                        "✅ Food donation posted successfully!";

                    document
                        .getElementById(
                            "donationForm"
                        )
                        .reset();

                } else {

                    document.getElementById(
                        "message"
                    ).innerText =
                        result.error;

                }

            } catch (error) {

                console.error(error);

                document.getElementById(
                    "message"
                ).innerText =
                    "Unable to connect to server.";

            }

        }
    );