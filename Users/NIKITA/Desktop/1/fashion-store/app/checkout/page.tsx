const renderCryptoModal = () => {
  if (!isCryptoModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Выберите криптовалюту</h3>
          <button 
            onClick={() => setIsCryptoModalOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {!cryptoAddress ? (
          <>
            <p className="text-gray-600 mb-4">Выберите криптовалюту для оплаты:</p>
            
            <div className="space-y-3 mb-6">
              {['LTC', 'USDT TRC-20', 'TON', 'NOT'].map((crypto) => (
                <div
                  key={crypto}
                  onClick={() => setSelectedCrypto(crypto)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedCrypto === crypto
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{crypto}</span>
                    {selectedCrypto === crypto && (
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleCryptoPayment}
              disabled={!selectedCrypto || loadingCryptoAddress}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                selectedCrypto && !loadingCryptoAddress
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loadingCryptoAddress ? 'Генерация адреса...' : 'Сгенерировать адрес оплаты'}
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-lg">Оплата {selectedCrypto}</h4>
              <button
                onClick={() => {
                  setIsCryptoModalOpen(false);
                  setCryptoAddress(null);
                  setSelectedCrypto(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(cryptoAddress)}`}
                    alt={`QR код для ${selectedCrypto}`}
                    className="w-40 h-40 object-contain"
                  />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Отсканируйте QR код телефоном или скопируйте постоянный адрес</p>
                <p className="text-sm text-gray-600 mb-2">Отправьте криптовалюту по адресу</p>
                <p className="text-sm text-gray-600 mb-2">Ожидайте поступления средств на баланс в течение 5 минут</p>
                <p className="text-sm text-gray-600">Минимальная сумма пополнения: <span className="font-medium">0.01 {selectedCrypto}</span></p>
              </div>
            </div>

            <div className="p-4 bg-gray-100 rounded-lg break-all">
              <p className="font-mono text-sm">{cryptoAddress}</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-700 text-sm">
                После отправки платежа, пожалуйста, сохраните TXID и сообщите о нем в поддержку
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};