# Yogique - Global Online Yoga Platform

Yogique is a modern, feature-rich web application designed to provide a global platform for online yoga. It connects users with instructors, offering personalized yoga programs tailored for professionals and corporate wellness.

## ✨ Features

- **User Authentication:** Secure login and registration powered by Supabase.
- **Role-Based Access Control:** Different dashboards and permissions for users, instructors, and admins.
- **Modular Dashboard:** A universal dashboard that adapts to the user's role.
- **Scheduling System:** Book one-on-one, group, and corporate classes.
- **Content Platform:** A learning section with articles and resources.
- **Admin Panels:** Comprehensive tools for managing users, classes, content, and more.

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/gizmoyogi/Yogique-gizmo.git
    cd Yogique-gizmo
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=YOUR_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

## 📜 Available Scripts

In the project directory, you can run:

-   `npm run dev`: Runs the app in development mode.
-   `npm run build`: Builds the app for production.
-   `npm run lint`: Lints the codebase using ESLint.
-   `npm run preview`: Serves the production build locally.
-   `npm test`: Runs the test suite using Jest.

## 🛠️ Technologies Used

-   **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Build Tool:** [Vite](https://vitejs.dev/)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Routing:** [React Router](https://reactrouter.com/)
-   **Backend & Auth:** [Supabase](https://supabase.com/)
-   **Testing:** [Jest](https://jestjs.io/), [React Testing Library](https://testing-library.com/)

## 🧱 Project Structure

This project follows a **feature-based modular architecture** to enhance scalability and maintainability.

```
src/
├── features/         # Self-contained feature modules (e.g., auth, admin, scheduling)
│   ├── auth/
│   ├── admin/
│   └── ...
├── shared/           # Reusable code shared across features
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   └── ...
└── App.tsx           # Main application component and routing setup
└── main.tsx          # Application entry point
```

Each feature directory typically contains its own `components`, `pages`, `hooks`, and `contexts`, keeping feature-related logic encapsulated.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a pull request.

## 📄 License

This project is licensed under the MIT License.

