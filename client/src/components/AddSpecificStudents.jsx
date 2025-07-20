// src/components/AddSpecificStudents.jsx

import React, { useState } from "react"
import { db } from "../firebase/config" // Adjust path as needed
import { collection, addDoc, Timestamp } from "firebase/firestore"

const studentData = [
  {
    rollNo: "AI3101",
    name: "THOKE ABHIJEET ASHOK",
    email: "abhijeet4554@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3102",
    name: "GADE ROHAN ASHOK",
    email: "rohangade863@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3103",
    name: "WANKHEDE SAHIL VIJAYKUMAR",
    email: "sahilwankhede1203@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3104",
    name: "MANGATE GAURAV SADASHIV",
    email: "gauravmangate27@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3105",
    name: "JANRAO POOJA GORAKHNATH",
    email: "poojajganrao@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3106",
    name: "BADAK PALLAVI PANDURANG",
    email: "pallavibadak48@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3107",
    name: "MOHD INZAMAM MOHD WASEEM",
    email: "inzamam8857839557@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3108",
    name: "KHANDADE DATTA ASHOK",
    email: "dattakhandade99@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3109",
    name: "RAJPUT YUVRAJ PRITAM",
    email: "yuvrajprajput75@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3110",
    name: "MUDE CHANDRAKANT VISHNU",
    email: "chadrkantmude1104@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3111",
    name: "VYAS VINAY PRAMOD",
    email: "vyasvinay95@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3112",
    name: "PATIL SARANG MOHAN",
    email: "sarangmpatil2004@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3113",
    name: "KHAN UNAYS YOUSUF",
    email: "unayskhan1104@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3114",
    name: "IRALEPATIL KETAN DAMODAR",
    email: "ketan@ketaniralepatil.com",
    batch: "B1",
  },
  {
    rollNo: "AI3115",
    name: "GHODKE PRATIK SUNIL",
    email: "ghodakepratik4@gmail.com",
    batch: "B1",
  },
  {
    rollNo: "AI3116",
    name: "WANKHEDE VAISHNAVI AMBADAS",
    email: "vaishnaviwankhede27@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3117",
    name: "DHOTE KARAN KANHAIYA",
    email: "karandhote843@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3118",
    name: "ADHAV ABHISHEK SURESH",
    email: "abhishekadhav56@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3119",
    name: "KAHN ZAIN PARVEZ AHMED",
    email: "zainkhan090907@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3120",
    name: "KURHADE ABHISHEK ARUN",
    email: "abhishekakurhade@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3121",
    name: "TOTALA SAKSHI SATYANARAYAN",
    email: "totlasakshi747@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3122",
    name: "KONDPALLE MRUNMAI ABHAY",
    email: "kondpallemrunmai@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3123",
    name: "SOLUNKE PRATIK SANJAY",
    email: "pratiksolunke16@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3124",
    name: "BABREKAR SHRIPAD RAJESH",
    email: "shripadrbabrekar@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3125",
    name: "MAHER AYUSH CHANDANSING",
    email: "ayushrajput2979@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3126",
    name: "PATEL MOHAMMAD ZAKWAN RIYAZUDDIN PATEL",
    email: "zakwanpatel100@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3127",
    name: "SHINDE RAVI RAOSAHEB",
    email: "ravishindeshinde12@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3128",
    name: "RATHOD KALYANI ANIL SINGH",
    email: "kalyanirathod51@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3129",
    name: "LANGOTE SHREYA PRASHANT",
    email: "langoteshreyB15@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3130",
    name: "FAROOQUEI MOHD SHOEAB QAMAR MOHD SHAFIODDIN",
    email: "shoeabfarooqui2021@gmail.com",
    batch: "B2",
  },
  {
    rollNo: "AI3131",
    name: "KHARWADE SUDARSHAN SARJERAO",
    email: "kharwadesudarshan1@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3132",
    name: "PACHLORE RITESH LAXMAN",
    email: "riteshpachlore1011@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3133",
    name: "AGRAWAL TARUN JAGDISH",
    email: "tarunagrewal8237@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3134",
    name: "PALSHIKAR GAURI GAJANAN",
    email: "gauripalshikar83@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3135",
    name: "GODASE CHAITRA MANJUNATH",
    email: "godasechaitra@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3136",
    name: "RAUT SHRUTIKA GOPAL",
    email: "shrutikaraut07@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3137",
    name: "GONGE NIKITA RAJARAM",
    email: "nikitagonge8390@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3138",
    name: "SHINDE KOMAL DATTATRAY",
    email: "komalshinde0110110@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3139",
    name: "SALVE ANWAY ANIL",
    email: "anwaysalve9@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3140",
    name: "PARADKAR SHREYA SUNIL",
    email: "shreyaparadkar0@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3141",
    name: "DESHMUKH CHINMAY DATTATRAY",
    email: "deshmukhchinmay351@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3142",
    name: "TAMBARE ABHISHEK BABAN",
    email: "abhishektambare41@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3143",
    name: "JADHAV PRITI VILAS",
    email: "jpriti330@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3144",
    name: "POPHALE ANIRUDHA ABASAHEB",
    email: "pophaleanirudha@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3145",
    name: "KAPSE AKANKSHA SANJAY",
    email: "kapseakanshB301@gmail.com",
    batch: "B3",
  },
  {
    rollNo: "AI3146",
    name: "CHAVAN ADITYA SUNIL",
    email: "adityachavanx1206@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3147",
    name: "CHATE ANKITA UDDHAV",
    email: "ankitachate304@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3148",
    name: "PARATKAR TEJAS SUDHIR",
    email: "tejasparatkar26iitb@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3149",
    name: "BIDVE NIKITA RAMESHWAR",
    email: "nikitabidve7@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3150",
    name: "TAYDE BHAGYASHRI VILAS",
    email: "bhagyashritayde2026@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3151",
    name: "SAYYAD ABUSAD TAHER",
    email: "sayyadabusad21@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3152",
    name: "JAWANJAL CHAITANYA DEVIDAS",
    email: "chaitanyajawanjal21@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3153",
    name: "JADHAV BHAGYASHRI SANTOSH",
    email: "jbhagyashri831@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3154",
    name: "VARPE SNEHAL SUNIL",
    email: "snehalvarpe1674@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3155",
    name: "WAJIRWAD SAKSHI PRALHAD",
    email: "sakshipw0207@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3156",
    name: "BAGUL ARCHANA TANHAJI",
    email: "archanabagul596@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3157",
    name: "PAWAR SHEETAL SANTOSH",
    email: "sheetalpawar1804@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3158",
    name: "NIKAM VAISHNAVI SUNIL",
    email: "nikamvaishanavi2344@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3159",
    name: "JAIPURKAR RUDRANI TULSHIDAS",
    email: "jaipurkarrudrani8@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3160",
    name: "SANGULE ABHISHEK ASHOK",
    email: "abhisheksangule6@gmail.com",
    batch: "B4",
  },
  {
    rollNo: "AI3161",
    name: "INDAPURE SUMEET SANJAY",
    email: "sumeetindapure7@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3162",
    name: "ADHAV SARTHAK BADRINATH",
    email: "sarthakadhav18@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3163",
    name: "GAIKWAD GANESH RAGHUNATH",
    email: "ganeshgaikwad5116@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3164",
    name: "BORSE SHIVANI EKNATH",
    email: "shivaniborse7103@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3165",
    name: "JAISWAL TANISHA VIJAY",
    email: "tanishajaiswal235@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3166",
    name: "WANKHADE SARVESH VINAYAK",
    email: "sarveshwankhade2004@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3167",
    name: "BHAGAT RUDRA PRASHANT",
    email: "rudrabhagat2001@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3168",
    name: "SHRIVASTAV DHEERAJ PRAKASH",
    email: "dheerajshirvastav98@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3169",
    name: "WARPE KOMAL GAJANAN",
    email: "komalwarpe04@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3170",
    name: "DESHPANDE VAISHNAVI PRAMOD",
    email: "vaishnavipd2708@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3171",
    name: "MACHAVE PRAGATI MAHADEV",
    email: "pragatimachave@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3172",
    name: "KULKARNI BHAKTI MANESH",
    email: "bhaktiikulkarnii2411@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3173",
    name: "DHUMAL RADHIKA BHASKAR",
    email: "radhikadhumal65@gmail.com",
    batch: "B5",
  },
  {
    rollNo: "AI3174",
    name: "GATLA PAWAN SRINIVAS",
    email: "pawangatla75@gmail.com",
    batch: "B5",
  },
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
      for (let i = 0; i < studentData.length; i++) {
        const student = studentData[i]

        const studentDoc = {
          name: student.name,
          rollNo: student.rollNo,
          email: student.email,
          department: "Computer Science",
          year: "3rd Year",
          batch: student.batch,
          createdAt: Timestamp.fromDate(new Date()),
          userId: null, // Will be set during student signup/login if they create an account
        }
        await addDoc(collection(db, "students"), studentDoc)
        console.log(
          `Added student: ${student.name} (${student.rollNo}) to ${student.batch}`
        )
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
        "Computer Science" department, "3rd Year", with their respective
        batches.
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
