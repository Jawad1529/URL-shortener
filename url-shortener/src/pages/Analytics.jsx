import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from '../components/templates/MainLayout';
import AnalyticsOverview from '../components/organisms/AnalyticsOverview';
import { getAnalytics } from '../services/api';

const Analytics = () => {
    const { shortCode } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (shortCode) {
            loadAnalytics(shortCode);
        } else {
            setLoading(false);
        }
    }, [shortCode]);

    const loadAnalytics = async (code) => {
        try {
            const analytics = await getAnalytics(code);
            setData(analytics);
        } catch {
            // Handle error silently
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout title="Analytics">
            <Toaster position="top-center" />
            <AnalyticsOverview data={data} loading={loading} />
        </MainLayout>
    );
};

export default Analytics;
