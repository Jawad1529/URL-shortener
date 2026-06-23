import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useHistory } from 'react-router-dom';
import MainLayout from '../components/templates/MainLayout';
import ShortenForm from '../components/organisms/ShortenForm';
import LinkList from '../components/organisms/LinkList';
import { getLinks } from '../services/api';

const Home = () => {
    const [links, setLinks] = useState([]);
    const history = useHistory();

    useEffect(() => {
        loadLinks();
    }, []);

    const loadLinks = async () => {
        try {
            const data = await getLinks();
            setLinks(data);
        } catch {
            // API not available yet
        }
    };

    const handleLinkCreated = (link) => {
        setLinks((prev) => [link, ...prev]);
    };

    return (
        <MainLayout title="URL Shortener">
            <Toaster position="top-center" />
            <ShortenForm onLinkCreated={handleLinkCreated} />
            <LinkList
                links={links}
                onViewAnalytics={(shortCode) => history.push(`/analytics/${shortCode}`)}
            />
        </MainLayout>
    );
};

export default Home;
