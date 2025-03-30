# fun_solutions

This project is a **Next.js-based scheduling system** with **SQLite** as the database, designed for seamless **session management and real-time validation**.  

### **Key Features:**  
✅ **Next.js Frontend**  
- Interactive form with real-time validation  
- Displays only available sessions with live updates  
- Ensures users select exactly **3 days (1 session per day)**  
- Provides visual cues for session capacities (e.g., "2/4 spots remaining")  

✅ **SQLite Database**  
- Stores student information and session enrollments  
- Tracks session capacities and prevents overbooking  
- Supports transactions for handling concurrent submissions  

✅ **API Layer**  
- Real-time session availability checks  
- Secure submission endpoints with server-side validation  
- Prevents double booking with proper request handling  

✅ **Form Validation**  
- Prevents selecting more than **one session per day**  
- Enforces the **three-day session rule**  
- Locks selections temporarily during submission to avoid conflicts  

This project ensures **efficient session management** with **real-time feedback**, **data integrity**, and **smooth user experience**. 🚀
