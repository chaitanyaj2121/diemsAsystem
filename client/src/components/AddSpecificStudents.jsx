// src/components/AddSpecificStudents.jsx

import React, { useState } from "react"
import { db } from "../firebase/config" // Adjust path as needed
import { collection, addDoc, Timestamp } from "firebase/firestore"

const studentData = [
  { rollNo: "2701", name: "THOKE ABHIJEET ASHOK" },
  { rollNo: "2702", name: "GADE ROHAN ASHOK" },
  { rollNo: "2703", name: "WANKHEDE SAHIL VIJAYKUMAR" },
  { rollNo: "2704", name: "MANGATE GAURAV SADASHIV" },
  { rollNo: "2705", name: "JANRAO POOJA GORAKHNATH" },
  { rollNo: "2706", name: "BADAK PALLAVI PANDURANG" },
  { rollNo: "2707", name: "MOHD INZAMAM MOHD WASEM" },
  { rollNo: "2708", name: "KHANDADE DATTA ASHOK" },
  { rollNo: "2709", name: "RAJPUT YUVRAJ PRITAM" },
  { rollNo: "2710", name: "BAIG SAFIULLAH SADATULLAH" },
  { rollNo: "2711", name: "MUDE CHANDRAKANT VISHNU" },
  { rollNo: "2712", name: "VYAS VINAY PRAMOD" },
  { rollNo: "2713", name: "PATIL SARANG MOHAN" },
  { rollNo: "2714", name: "KHAN UMAYS YOUSUF" },
  { rollNo: "2715", name: "IRALEPATIL KETAN DAMODAR" },
  { rollNo: "2716", name: "GHODKE PRATIK SUNIL" },
  { rollNo: "2717", name: "WANKHEDE VAISHNAVI AMBADAS" },
  { rollNo: "2718", name: "DHOTE KARAN KANHAIYA" },
  { rollNo: "2719", name: "ADHAV ABHISHEK SURESH" },
  { rollNo: "2720", name: "KAHN ZAIN PARVEZ AHMED" },
  { rollNo: "2721", name: "KURHADE ABHISHEK ARUN" },
  { rollNo: "2722", name: "TOTALA SAKSHI SATYANARAYAN" },
  { rollNo: "2723", name: "KONDPALLE MRUNMAI ABHAY" },
  { rollNo: "2724", name: "SOLUNKE PRATIK SANJAY" },
  { rollNo: "2725", name: "BABREKAR SHRIPAD RAJESH" },
  { rollNo: "2726", name: "AYUSH CHANDANSING MAHER" },
  { rollNo: "2727", name: "ZAKWAAN RIYAZUDDIN" },
  { rollNo: "2728", name: "SHINDE RAVI RAOSAHEB" },
  { rollNo: "2729", name: "KALYANI ANIL SINGH RATHOD" },
  { rollNo: "2730", name: "LANGOTE SHREYA PRASHANT" },
  { rollNo: "2731", name: "QAMAR MOHD SHAFIOODIN" },
  { rollNo: "2732", name: "KHARWADE SUDARSHAN SARJERAO" },
  { rollNo: "2733", name: "PACHLORE RITESH LAXMAN" },
  { rollNo: "2734", name: "TARUN JAGDISH AGRAWAL" },
  { rollNo: "2735", name: "PALSHIKAR GAURI GAJANAN" },
  { rollNo: "2736", name: "GODASE CHAITRA MANJUNATH" },
  { rollNo: "2737", name: "RAUT SHRUTIKA GOPAL" },
  { rollNo: "2738", name: "GONGE NIKITA RAJARAM" },
  { rollNo: "2739", name: "SHINDE KOMAL DATTATRAY" },
  { rollNo: "2740", name: "SALVE ANWAY ANIL" },
  { rollNo: "2741", name: "PARADKAR SHREYA SUNIL" },
  { rollNo: "2742", name: "DESHMUKH CHINMAY DATTATRAY" },
  { rollNo: "2743", name: "TAMBARE ABHISHEK BABAN" },
  { rollNo: "2744", name: "JADHAV PRITI VILAS" },
  { rollNo: "2745", name: "POPHALE ANIRUDHA ABASAHEB" },
  { rollNo: "2746", name: "AKANKSHA SANJAY KAPSE" },
  { rollNo: "2747", name: "CHAVAN ADITYA SUNIL" },
  { rollNo: "2748", name: "CHATE ANKITA UDDHAV" },
  { rollNo: "2749", name: "PARATKAR TEJAS SUDHIR" },
  { rollNo: "2750", name: "SANKET PRABHAT SHELKE" },
  { rollNo: "2751", name: "BIDVE NIKITA RAMESHWAR" },
  { rollNo: "2752", name: "TAYDE BHAGYASHRI VILAS" },
  { rollNo: "2753", name: "SAYYAD ABUSAD TAHER" },
  { rollNo: "2754", name: "JAWANJAL CHAITANYA DEVIDAS" },
  { rollNo: "2755", name: "JADHAV BHAGYASHRI SANTOSH" },
  { rollNo: "2756", name: "VARPE SNEHAL SUNIL" },
  { rollNo: "2757", name: "WAJIRWAD SAKSHI PRALHAD" },
  { rollNo: "2758", name: "BAGUL ARCHANA TANHAJI" },
  { rollNo: "2759", name: "PAWAR SHEETAL SANTOSH" },
  { rollNo: "2760", name: "VAISHNAVI SUNIL NIKAM" },
  { rollNo: "2761", name: "JAIPURKAR RUDRANI TULSHIDAS" },
  { rollNo: "2762", name: "SANGULE ABHISHEK ASHOK" },
  { rollNo: "2763", name: "INDAPURE SUMEET SANJAY" },
  { rollNo: "2764", name: "ADHAV SARTHAK BADRINATH" },
  { rollNo: "2765", name: "GAIKWAD GANESH RAGHUNATH" },
  { rollNo: "2766", name: "BORSE SHIVANI EKNATH" },
  { rollNo: "2767", name: "JAISWAL TANISHA VIJAY" },
  { rollNo: "2768", name: "KASHYAP SANJANA" },
]

const AddSpecificStudents = () => {
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [addedCount, setAddedCount] = useState(0)

  const addStudentsToFirestore = async () => {
    setLoading(true)
    setStatus("Adding students...")
    setAddedCount(0)
    try {
      for (const student of studentData) {
        // Generate a simple email based on roll number and name
        const email = `${student.name.toLowerCase().replace(/\s/g, ".")}.${
          student.rollNo
        }@example.com`

        const studentDoc = {
          name: student.name,
          rollNo: student.rollNo,
          email: email,
          department: "Computer Science",
          year: "3rd Year",
          createdAt: Timestamp.fromDate(new Date()), // Current timestamp
          userId: null, // Will be set during student signup/login if they create an account
        }
        await addDoc(collection(db, "students"), studentDoc)
        console.log(`Added student: ${student.name} (${student.rollNo})`)
        setAddedCount((prev) => prev + 1)
      }
      setStatus(`Successfully added ${studentData.length} students!`)
    } catch (e) {
      console.error("Error adding documents: ", e)
      setStatus(`Error adding students: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Add Specific Students
      </h2>
      <p className="text-gray-600 mb-4">
        Click the button below to add the provided list of students to the
        "Computer Science" department, "3rd Year".
      </p>
      <button
        onClick={addStudentsToFirestore}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Adding {addedCount}/{studentData.length}...
          </div>
        ) : (
          `Add ${studentData.length} Specific Students`
        )}
      </button>
      {status && (
        <p
          className={`mt-4 text-center ${
            status.includes("Error") ? "text-red-600" : "text-green-600"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  )
}

export default AddSpecificStudents
