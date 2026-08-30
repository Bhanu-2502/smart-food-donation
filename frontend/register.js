const API_URL = "http://127.0.0.1:5000";


function getLocation() {

    if (!navigator.geolocation) {

        alert(
            "Geolocation is not supported."
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
                "📍 Location captured successfully";

        },


        function (error) {

            console.error(error);

            alert(
                "Unable to get your location."
            );

        }

    );
}


document
    .getElementById("registerForm")
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const user = {

                name:
                    document.getElementById(
                        "name"
                    ).value,

                email:
                    document.getElementById(
                        "email"
                    ).value,

                password:
                    document.getElementById(
                        "password"
                    ).value,

                phone:
                    document.getElementById(
                        "phone"
                    ).value,

                role:
                    document.getElementById(
                        "role"
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
                    ) || null,

                longitude:
                    Number(
                        document.getElementById(
                            "longitude"
                        ).value
                    ) || null

            };


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(user)
                        }
                    );


                const result =
                    await response.json();


                if (!response.ok) {

                    document.getElementById(
                        "registerMessage"
                    ).innerText =
                        result.error;

                    return;
                }


                document.getElementById(
                    "registerMessage"
                ).innerText =
                    "✅ Registration successful!";


                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );


            } catch (error) {

                console.error(error);

                document.getElementById(
                    "registerMessage"
                ).innerText =
                    "Unable to connect to server.";

            }

        }
    );