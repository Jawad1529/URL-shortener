import Input from '../atoms/Input';
import Button from '../atoms/Button';

const UrlInputGroup = ({ url, onUrlChange, onShorten, loading = false }) => (
    <div className="p-4">
        <Input
            label="Enter URL"
            placeholder="https://example.com/very-long-url"
            value={url}
            onIonInput={onUrlChange}
            type="url"
            disabled={loading}
        />
        <Button
            label={loading ? 'Shortening...' : 'Shorten'}
            onClick={onShorten}
            disabled={loading || !url.trim()}
            expand="block"
            color="primary"
        />
    </div>
);

export default UrlInputGroup;
