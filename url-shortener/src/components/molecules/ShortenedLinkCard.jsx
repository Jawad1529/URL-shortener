import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip } from '@ionic/react';
import { copyOutline, analyticsOutline } from 'ionicons/icons';
import Icon from '../atoms/Icon';

const ShortenedLinkCard = ({
    shortUrl,
    originalUrl,
    clicks = 0,
    onCopy,
    onViewAnalytics,
}) => (
    <IonCard className="my-3">
        <IonCardHeader>
            <IonCardTitle className="text-lg font-semibold text-blue-600">
                {shortUrl}
            </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
            <p className="text-sm text-gray-500 truncate">{originalUrl}</p>
            <div className="flex justify-between items-center mt-2">
                <IonChip color="medium">{clicks} clicks</IonChip>
                <div className="flex gap-3">
                    <Icon icon={copyOutline} onClick={onCopy} color="primary" />
                    {onViewAnalytics && (
                        <Icon icon={analyticsOutline} onClick={onViewAnalytics} color="secondary" />
                    )}
                </div>
            </div>
        </IonCardContent>
    </IonCard>
);

export default ShortenedLinkCard;
