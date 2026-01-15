import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { InstructorRatesPage } from './src/features/instructor-rates/pages/InstructorRatesPage';
import { InstructorProvider } from './src/features/scheduling/components/InstructorProvider';
import InstructorProfile from './src/features/scheduling/pages/InstructorProfile';
import { ToastProvider } from './src/shared/contexts/ToastContext';
// ...existing imports...

function App() {
    return (
        <Router>
            <ToastProvider>
                <InstructorProvider>
                    <div className="App">
                        {/* ...existing code... */}
                        <Routes>
                            {/* ...existing routes... */}
                            <Route path="/instructor/:instructorId" element={<InstructorProfile />} />
                            <Route path="/manage-rates" element={<InstructorRatesPage />} />
                        </Routes>
                    </div>
                </InstructorProvider>
            </ToastProvider>
        </Router>
    );
}

export default App;