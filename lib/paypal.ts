const base = process.env.PAYPAL_API_URL || '';

export const paypal = {
    createOrder: async (price: number) => {
        const accessToken = await generateAccessToken();
        const url = `${base}/v2/checkout/orders`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                intent: "CAPTURE",
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: price
                        } 
                    }
                ]
            })
        })

        return handleResponse(response);

    },
    capturePayment: async(orderId: string) => {
        const accessToken = await generateAccessToken();
        const url = `${base}/v2/checkout/orders/${orderId}/capture`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            method: 'POST'
        });

        return handleResponse(response);

    }
}


// Generate paypal access token


export async function generateAccessToken() {

    const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } =  process.env;
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64');
    const response = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const data = await handleResponse(response);
    return data.access_token;
}

async function handleResponse(response: Response) {
    if(response.ok) {
        return response.json();        
    }
    else {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}


