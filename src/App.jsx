import React, { useState, useEffect, useMemo, useRef } from 'react';
// Note: All Firebase and Firestore imports have been removed.
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Calculator, History, Trash2 } from 'lucide-react';

// --- Color Palette for Graph ---
const USER_COLORS = ['#6366F1', '#F472B6', '#34D399', '#FBBF24'];

// --- Helper function to get BMI category details ---
const getBmiCategory = (bmi) => {
    if (bmi < 18.5) return { name: 'Underweight', color: 'text-blue-400' };
    if (bmi >= 18.5 && bmi < 25) return { name: 'Normal', color: 'text-green-400' };
    if (bmi >= 25 && bmi < 30) return { name: 'Overweight', color: 'text-yellow-400' };
    return { name: 'Obese', color: 'text-red-400' };
};

// --- Pre-populated Sample Data ---
const generateSampleData = () => {
    const data = [
      // User 1: Starts overweight, trends down to normal
      { id: 'u1e1', user: 1, bmi: 28.0, timestamp: new Date('2025-01-15') },
      { id: 'u1e2', user: 1, bmi: 27.1, timestamp: new Date('2025-02-15') },
      { id: 'u1e3', user: 1, bmi: 26.2, timestamp: new Date('2025-03-15') },
      { id: 'u1e4', user: 1, bmi: 25.5, timestamp: new Date('2025-04-15') },
      { id: 'u1e5', user: 1, bmi: 24.8, timestamp: new Date('2025-05-15') },

      // User 2: Stays consistently in the normal range
      { id: 'u2e1', user: 2, bmi: 22.5, timestamp: new Date('2025-01-20') },
      { id: 'u2e2', user: 2, bmi: 22.8, timestamp: new Date('2025-02-20') },
      { id: 'u2e3', user: 2, bmi: 22.6, timestamp: new Date('2025-03-20') },
      { id: 'u2e4', user: 2, bmi: 23.0, timestamp: new Date('2025-04-20') },
      { id: 'u2e5', user: 2, bmi: 22.9, timestamp: new Date('2025-05-20') },

      // User 3: Starts underweight, trends up towards normal
      { id: 'u3e1', user: 3, bmi: 17.9, timestamp: new Date('2025-01-10') },
      { id: 'u3e2', user: 3, bmi: 18.2, timestamp: new Date('2025-02-10') },
      { id: 'u3e3', user: 3, bmi: 18.6, timestamp: new Date('2025-03-10') },
      { id: 'u3e4', user: 3, bmi: 19.0, timestamp: new Date('2025-04-10') },
      { id: 'u3e5', user: 3, bmi: 19.5, timestamp: new Date('2025-05-10') },

      // User 4: Fluctuates between normal and overweight
      { id: 'u4e1', user: 4, bmi: 24.5, timestamp: new Date('2025-01-25') },
      { id: 'u4e2', user: 4, bmi: 25.2, timestamp: new Date('2025-02-25') },
      { id: 'u4e3', user: 4, bmi: 24.8, timestamp: new Date('2025-03-25') },
      { id: 'u4e4', user: 4, bmi: 25.5, timestamp: new Date('2025-04-25') },
      { id: 'u4e5', user: 4, bmi: 25.0, timestamp: new Date('2025-05-25') }
    ];

    // Add category and color info to each entry
    return data.map(entry => {
        const categoryInfo = getBmiCategory(entry.bmi);
        return { ...entry, category: categoryInfo.name, color: categoryInfo.color };
    });
};


// --- Main App Component ---
const App = () => {
    // --- State Management ---
    const [numUsers, setNumUsers] = useState(4); // Default to 4 users
    const [activeUser, setActiveUser] = useState(1);

    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [unit, setUnit] = useState('metric');

    const [latestResult, setLatestResult] = useState(null);
    // FIX: Initialize state with the sample data.
    const [history, setHistory] = useState(generateSampleData());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Refs for scrolling ---
    const chartRef = useRef(null);

    // --- Auto-Scrolling Effect ---
    useEffect(() => {
        if (latestResult) {
            chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [latestResult]);

    // --- Core Logic ---
    const handleUserCountChange = (e) => {
        const count = parseInt(e.target.value, 10);
        setNumUsers(count);
        setActiveUser(1);
        // Clear history when changing user count for simplicity
        setHistory([]);
        setLatestResult(null);
    };

    const calculateBmi = (e) => {
        e.preventDefault();
        setError('');
        let w = parseFloat(weight);
        let h = parseFloat(height);

        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
            setError('Please enter valid, positive numbers.');
            return;
        }

        let bmi = (unit === 'metric') ? (w / ((h / 100) ** 2)) : ((w / (h ** 2)) * 703);

        if (isNaN(bmi) || !isFinite(bmi)) {
            setError('Could not calculate BMI. Check inputs.');
            return;
        }

        const category = getBmiCategory(bmi);
        const newResult = {
            id: crypto.randomUUID(),
            user: activeUser,
            bmi: parseFloat(bmi.toFixed(1)),
            category: category.name,
            color: category.color,
            timestamp: new Date(),
        };

        setLatestResult(newResult);
        saveToHistory(newResult);
        setWeight('');
        setHeight('');
    };

    const saveToHistory = (result) => {
        setHistory(prevHistory => [...prevHistory, result]);
    };

    const deleteHistoryItem = (itemToDelete) => {
       setHistory(prevHistory => prevHistory.filter(item => item.id !== itemToDelete.id));
    };

    // --- Memoized Data Formatting for Performance ---
    const groupedHistory = useMemo(() => {
        // Sort the history by timestamp before grouping
        const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        return sortedHistory.reduce((acc, doc) => {
            const user = doc.user;
            if (!acc[user]) {
                acc[user] = [];
            }
            acc[user].push(doc);
            return acc;
        }, {});
    }, [history]);

    const combinedHistoryForTable = useMemo(() => {
       return [...history].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }, [history]);

    const chartData = useMemo(() => {
        if (Object.keys(groupedHistory).length === 0) return [];

        const maxEntries = Math.max(0, ...Object.values(groupedHistory).map(h => h.length));
        if (maxEntries === 0) return [];

        const data = [];
        for (let i = 0; i < maxEntries; i++) {
            const entry = { name: `Entry ${i + 1}` };
            for (let user = 1; user <= numUsers; user++) {
                if (groupedHistory[user] && groupedHistory[user][i]) {
                    entry[`User ${user}`] = groupedHistory[user][i].bmi;
                }
            }
            data.push(entry);
        }
        return data;
    }, [groupedHistory, numUsers]);

    const weightPlaceholder = unit === 'metric' ? 'Weight (kg)' : 'Weight (lbs)';
    const heightPlaceholder = unit === 'metric' ? 'Height (cm)' : 'Height (in)';

    // --- Render JSX ---
    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-6xl mx-auto">
                <header className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-indigo-500 p-2 rounded-lg"><Users className="h-8 w-8 text-white"/></div>
                        <div>
                           <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Multi-User BMI Comparison</h1>
                           <p className="text-gray-400 text-sm">Track and compare wellness journeys.</p>
                        </div>
                    </div>
                </header>

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                             <div className="mb-4">
                                <label htmlFor="user-count" className="block text-sm font-medium text-gray-300 mb-2">Number of Users to Compare</label>
                                <select id="user-count" value={numUsers} onChange={handleUserCountChange} className="w-full bg-gray-700 p-2 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value={2}>2 Users</option>
                                    <option value={3}>3 Users</option>
                                    <option value={4}>4 Users</option>
                                </select>
                            </div>
                            <div className="flex border-b border-gray-700 mb-4">
                                {Array.from({ length: numUsers }, (_, i) => i + 1).map(userNum => (
                                    <button key={userNum} onClick={() => setActiveUser(userNum)} className={`flex-1 p-3 text-sm font-medium transition-colors ${activeUser === userNum ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}>
                                        User {userNum}
                                    </button>
                                ))}
                            </div>

                             {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                            <form onSubmit={calculateBmi} className="space-y-4">
                                <div className="flex bg-gray-900 rounded-lg p-1">
                                    <button type="button" onClick={() => setUnit('metric')} className={`w-1/2 p-2 rounded-md text-sm font-medium transition ${unit === 'metric' ? 'bg-indigo-500' : 'hover:bg-gray-700'}`}>Metric</button>
                                    <button type="button" onClick={() => setUnit('imperial')} className={`w-1/2 p-2 rounded-md text-sm font-medium transition ${unit === 'imperial' ? 'bg-indigo-500' : 'hover:bg-gray-700'}`}>Imperial</button>
                                </div>
                                <input type="number" step="0.1" placeholder={weightPlaceholder} value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                <input type="number" step="0.1" placeholder={heightPlaceholder} value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-gray-700 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-3 rounded-lg transition-colors shadow-md flex items-center justify-center space-x-2">
                                    <Calculator size={18} />
                                    <span>Calculate for User {activeUser}</span>
                                </button>
                            </form>
                        </div>
                         {latestResult && (
                             <div className="bg-gray-800 p-6 rounded-2xl shadow-lg animate-fade-in">
                                <h2 className="text-xl font-semibold mb-4">Last Result (User {latestResult.user})</h2>
                                <div className="text-center">
                                    <p className={`text-6xl font-bold ${latestResult.color}`}>{latestResult.bmi}</p>
                                    <p className={`text-2xl font-semibold mt-2 ${latestResult.color}`}>{latestResult.category}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                        <div ref={chartRef} className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center space-x-3 mb-4"><TrendingUp className="h-6 w-6 text-indigo-400"/><h2 className="text-xl font-semibold">Comparison Trend</h2></div>
                            <div className="h-80 w-full">
                                {isLoading ? (<div className="flex justify-center items-center h-full text-gray-400">Loading chart...</div>)
                                : chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                                            <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
                                            <YAxis stroke="#A0AEC0" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']}/>
                                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                                            <Legend wrapperStyle={{fontSize: "14px"}}/>
                                            {Array.from({ length: numUsers }, (_, i) => i + 1).map(userNum => (
                                                <Line key={userNum} type="monotone" dataKey={`User ${userNum}`} stroke={USER_COLORS[userNum - 1]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} connectNulls />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (<div className="flex justify-center items-center h-full text-gray-400"><p>Enter data for users to see the comparison chart.</p></div>)}
                            </div>
                        </div>

                        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center space-x-3 mb-4"><History className="h-6 w-6 text-indigo-400"/><h2 className="text-xl font-semibold">Combined History</h2></div>
                            <div className="overflow-auto max-h-96">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="p-3 text-sm font-semibold text-gray-400">User</th>
                                            <th className="p-3 text-sm font-semibold text-gray-400">Date</th>
                                            <th className="p-3 text-sm font-semibold text-gray-400">BMI</th>
                                            <th className="p-3 text-sm font-semibold text-gray-400">Category</th>
                                            <th className="p-3 text-sm font-semibold text-gray-400"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {combinedHistoryForTable.length > 0 ? (
                                            combinedHistoryForTable.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                    <td className="p-3 font-bold" style={{color: USER_COLORS[item.user - 1]}}>User {item.user}</td>
                                                    <td className="p-3 text-sm">{new Date(item.timestamp).toLocaleDateString()}</td>
                                                    <td className="p-3 font-medium">{item.bmi.toFixed(1)}</td>
                                                    <td className={`p-3 font-medium ${getBmiCategory(item.bmi).color}`}>{item.category}</td>
                                                    <td className="p-3 text-right">
                                                        <button onClick={() => deleteHistoryItem(item)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={18}/></button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (<tr><td colSpan="5" className="text-center p-4 text-gray-400">No records found.</td></tr>)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;