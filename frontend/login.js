const API_URL = "https://smart-food-donation-o4yh.onrender.com";


// ============================================================
// LOGIN FORM
// ============================================================

document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {

        event.preventDefault();


        // ====================================================
        // GET LOGIN DETAILS
        // ====================================================

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;


        // ====================================================
        // LOGIN REQUEST
        // ====================================================

        try {

            const response = await fetch(
                `${API_URL}/api/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );


            const result = await response.json();


            // =================================================
            // LOGIN FAILED
            // =================================================

            if (!response.ok) {

                document.getElementById("loginMessage").innerText =
                    result.error || "Invalid email or password.";

                return;
            }


            // =================================================
            // SAVE USER INFORMATION
            // =================================================

            localStorage.setItem(
                "user",
                JSON.stringify(result.user)
            );


            // =================================================
            // TEMPORARY DIAGNOSTIC MESSAGE
            // =================================================

            alert(
                "LOGIN SUCCESSFUL\n\n" +
                "Name: " + result.user.name + "\n" +
                "Email: " + result.user.email + "\n" +
                "Role: " + result.user.role
            );


            // =================================================
            // REDIRECT BASED ON ROLE
            // =================================================

            if (
                result.user.role &&
                result.user.role.toUpperCase() === "DONOR"
            ) {

                window.location.href =
                    "donor-dashboard.html";

            }

            else if (
                result.user.role &&
                result.user.role.toUpperCase() === "NGO"
            ) {

                window.location.href =
                    "ngo-dashboard.html";

            }

            else {

                document.getElementById("loginMessage").innerText =
                    "Invalid user role.";

            }

        }


        // ====================================================
        // SERVER CONNECTION ERROR
        // ====================================================

        catch (error) {

            console.error("Login error:", error);

            document.getElementById("loginMessage").innerText =
                "Unable to connect to server.";

        }

    });