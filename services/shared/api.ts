import { API_BASE_URL, AuthService } from '../auth.service';

export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount: number = 0,
  baseUrlOverride?: string,
): Promise<T> => {
  const baseUrl = baseUrlOverride ?? API_BASE_URL;
  const url = `${baseUrl}${endpoint}`;

  // Récupérer le token d'authentification si disponible
  const token = await AuthService.getAccessToken();
  
  // Construire les headers par défaut
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  
  // Ajouter le header Authorization si un token est présent et qu'il n'est pas déjà dans les headers
  if (token && !defaultHeaders.Authorization) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
    console.log('🔑 [API Call] Token d\'authentification ajouté automatiquement');
  } else if (!token) {
    console.warn('⚠️ [API Call] Aucun token d\'authentification disponible');
  }

  // S'assurer que les headers sont correctement passés
  const finalOptions: RequestInit = {
    ...options,
    headers: defaultHeaders,
  };

  console.log('🌐 [API Call] Requête:', {
    url,
    method: finalOptions.method || 'GET',
    hasHeaders: !!finalOptions.headers,
    headersKeys: finalOptions.headers ? Object.keys(finalOptions.headers as Record<string, string>) : [],
    hasBody: !!finalOptions.body,
    bodyPreview: finalOptions.body ? (typeof finalOptions.body === 'string' ? finalOptions.body.substring(0, 200) + (finalOptions.body.length > 200 ? '...' : '') : String(finalOptions.body).substring(0, 200)) : undefined,
  });

  // Log du body complet si présent
  if (finalOptions.body && typeof finalOptions.body === 'string') {
    console.log('📤 [API Call] Body JSON envoyé:', finalOptions.body);
    try {
      const bodyParsed = JSON.parse(finalOptions.body);
      console.log('📤 [API Call] Body JSON parsé:', JSON.stringify(bodyParsed, null, 2));
    } catch (e) {
      console.log('📤 [API Call] Body n\'est pas du JSON valide:', finalOptions.body);
    }
  }

  const startTime = Date.now();
  const response = await fetch(url, finalOptions);
  const duration = Date.now() - startTime;

  console.log('📥 [API Call] Réponse reçue:', {
    status: response.status,
    statusText: response.statusText,
    duration: duration + 'ms',
    ok: response.ok,
    contentType: response.headers.get('content-type'),
    headers: {
      'content-type': response.headers.get('content-type'),
      'content-length': response.headers.get('content-length'),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');

    console.error('❌ [API Call] Erreur HTTP:', {
      status: response.status,
      statusText: response.statusText,
      url,
      method: finalOptions.method || 'GET',
      errorText: errorText.substring(0, 500),
      hasAuthHeader: !!(finalOptions.headers as Record<string, string>)?.Authorization,
    });

    // Si erreur 401, logger plus d'informations pour le debug
    if (response.status === 401) {
      console.error('❌ [API] Erreur 401 - Non autorisé:', {
        url,
        method: finalOptions.method || 'GET',
        hasAuthHeader: !!(finalOptions.headers as Record<string, string>)?.Authorization,
        authHeaderPreview: (finalOptions.headers as Record<string, string>)?.Authorization?.substring(0, 30) + '...',
      });
    }

    const errorMessage = `HTTP ${response.status}: ${errorText}`;
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    console.log('✅ [API Call] Réponse 204 No Content - retour undefined');
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const jsonData = await response.json();
   
    return jsonData as T;
  }

  const textData = await response.text();
  console.log('✅ [API Call] Réponse texte:', {
    length: textData.length,
    preview: textData.substring(0, 200) + (textData.length > 200 ? '...' : ''),
  });
  return textData as T;
};

