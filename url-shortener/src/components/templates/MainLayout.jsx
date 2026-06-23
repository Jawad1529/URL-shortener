import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
} from '@ionic/react';
import { analyticsOutline, linkOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

const MainLayout = ({ title, children }) => {
    const history = useHistory();

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle className="font-bold">{title}</IonTitle>
                    <IonButtons slot="end">
                        <IonButton onClick={() => history.push('/home')}>
                            <IonIcon icon={linkOutline} />
                        </IonButton>
                        <IonButton onClick={() => history.push('/analytics')}>
                            <IonIcon icon={analyticsOutline} />
                        </IonButton>
                    </IonButtons>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>{children}</IonContent>
        </IonPage>
    );
};

export default MainLayout;
