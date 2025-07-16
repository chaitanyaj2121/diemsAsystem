import React, { useState } from "react"
import { auth, db } from "../firebase/config"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useNavigate } from "react-router-dom"

function HodLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )
      const user = userCredential.user

      // Verify if the user is an HoD by checking their role in Firestore
      const hodDocRef = doc(db, "hods", user.uid)
      const hodDocSnap = await getDoc(hodDocRef)

      if (hodDocSnap.exists() && hodDocSnap.data().role === "HoD") {
        alert("Logged in successfully!")
        navigate("/hod-dashboard") // Redirect to the HoD dashboard
      } else {
        // If user exists but is not an HoD, or no corresponding HoD document
        await auth.signOut() // Log out the user immediately
        setError("You are not authorized to access the HoD dashboard.")
      }
    } catch (err) {
      console.error("Error logging in:", err.message)
      if (
        err.code === "auth/invalid-email" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Invalid email or password.")
      } else {
        setError("Failed to log in: " + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h2>HoD Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.formGroup}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Logging In..." : "Login"}
        </button>
      </form>
      <p style={styles.signupLink}>
        Don't have an account?{" "}
        <span onClick={() => navigate("/hod-signup")} style={styles.link}>
          Sign Up here
        </span>
      </p>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "20px",
    boxSizing: "border-box",
  },
  form: {
    backgroundColor: "#ffffff",
    padding: "30px",
    borderRadius: "8px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  formGroup: {
    marginBottom: "15px",
  },
  label: {
    display: "block",
    marginBottom: "5px",
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "16px",
    marginTop: "10px",
  },
  error: {
    color: "red",
    marginBottom: "15px",
    textAlign: "center",
  },
  signupLink: {
    marginTop: "20px",
    color: "#555",
  },
  link: {
    color: "#007bff",
    cursor: "pointer",
    textDecoration: "underline",
  },
}

export default HodLogin
