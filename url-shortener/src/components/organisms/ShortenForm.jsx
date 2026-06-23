import { useState } from 'react';
import { IonText } from '@ionic/react';
import toast from 'react-hot-toast';
import UrlInputGroup from '../molecules/UrlInputGroup';
import ShortenedLinkCard from '../molecules/ShortenedLinkCard';
import { shortenUrl } from '../../services/api';

const ShortenForm = ({ onLinkCreated }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [recentLinks, setRecentLinks] = useState([]);

    const handleShorten = async () => {
        if (!url.trim()) return;

        setLoading(true);
        try {
            const link = await shortenUrl(url);
            setRecentLinks((prev) => [link, ...prev]);
            setUrl('');
            onLinkCreated?.(link);
            toast.success('Link shortened!');
        } catch (error) {
            const message = error?.response?.data?.error || 'Failed to shorten URL';
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (shortUrl) => {
        navigator.clipboard.writeText(shortUrl);
        toast.success('Copied to clipboard!');
    };

    return (
        <div className="mb-4">
            <UrlInputGroup
                url={url}
                onUrlChange={(e) => setUrl(e.detail.value || '')}
                onShorten={handleShorten}
                loading={loading}
            />
            {recentLinks.length > 0 && (
                <>
                    <IonText color="medium">
                        <p className="px-4 text-sm">Recent links</p>
                    </IonText>
                    {recentLinks.map((link) => (
                        <ShortenedLinkCard
                            key={link.shortCode}
                            shortUrl={link.shortUrl}
                            originalUrl={link.originalUrl}
                            clicks={link.clicks}
                            onCopy={() => handleCopy(link.shortUrl)}
                        />
                    ))}
                </>
            )}
        </div>
    );
};

export default ShortenForm;
