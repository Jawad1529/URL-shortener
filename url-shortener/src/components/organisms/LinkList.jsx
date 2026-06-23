import { IonText } from '@ionic/react';
import toast from 'react-hot-toast';
import ShortenedLinkCard from '../molecules/ShortenedLinkCard';

const LinkList = ({ links, onViewAnalytics }) => {
    const handleCopy = (shortUrl) => {
        navigator.clipboard.writeText(shortUrl);
        toast.success('Copied to clipboard!');
    };

    if (links.length === 0) {
        return (
            <div className="text-center py-10 px-4">
                <IonText color="medium">
                    <p>No links yet. Shorten your first URL above!</p>
                </IonText>
            </div>
        );
    }

    return (
        <div className="px-2">
            {links.map((link) => (
                <ShortenedLinkCard
                    key={link.shortCode}
                    shortUrl={link.shortUrl}
                    originalUrl={link.originalUrl}
                    clicks={link.clicks}
                    onCopy={() => handleCopy(link.shortUrl)}
                    onViewAnalytics={
                        onViewAnalytics ? () => onViewAnalytics(link.shortCode) : undefined
                    }
                />
            ))}
        </div>
    );
};

export default LinkList;
