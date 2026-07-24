import { useState, useEffect } from "react";
import { Product, productService } from "../lib/supabase";
import { AlertCircle, Upload, X, Loader, Percent, DollarSign } from "lucide-react";
import { calculateSalePrice, calculateDiscountPercentage, roundPrice, roundPercentage, formatPrice } from "../lib/pricing";

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    initialPrice: "",
    salePrice: "",
    discountPercentage: "",
    costPrice: "",
    stock: "",
    category: "",
    active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [lastModifiedField, setLastModifiedField] = useState<'salePrice' | 'discountPercentage' | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        initialPrice: product.initialPrice.toString(),
        salePrice: product.salePrice.toString(),
        discountPercentage: product.discountPercentage.toString(),
        costPrice: (product.costPrice || 0).toString(),
        stock: product.stock.toString(),
        category: product.category,
        active: product.active,
      });
      setImagePreview(product.imageUrl);
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Gestion des calculs de prix et remises
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    if (name === 'initialPrice') {
      setFormData(prev => ({
        ...prev,
        initialPrice: value,
        // Si pas de remise, ajuster le prix de vente
        salePrice: prev.discountPercentage === '0' || !prev.discountPercentage 
          ? value 
          : calculateSalePrice(numValue, parseFloat(prev.discountPercentage)).toString()
      }));
    } else if (name === 'salePrice') {
      setLastModifiedField('salePrice');
      const initialPrice = parseFloat(formData.initialPrice) || 0;
      const discount = initialPrice > 0 ? calculateDiscountPercentage(initialPrice, numValue) : 0;
      setFormData(prev => ({
        ...prev,
        salePrice: value,
        discountPercentage: discount.toString()
      }));
    } else if (name === 'discountPercentage') {
      setLastModifiedField('discountPercentage');
      const initialPrice = parseFloat(formData.initialPrice) || 0;
      const salePrice = calculateSalePrice(initialPrice, numValue);
      setFormData(prev => ({
        ...prev,
        discountPercentage: value,
        salePrice: salePrice.toString()
      }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleRemoveDiscount = () => {
    setFormData(prev => ({
      ...prev,
      discountPercentage: "0",
      salePrice: prev.initialPrice
    }));
    setLastModifiedField(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors({ image: "Format non accepté. Utilisez JPG, PNG ou WebP." });
      return;
    }

    // Vérifier la taille (5 Mo max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ image: "L'image ne doit pas dépasser 5 Mo." });
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.image;
      return newErrors;
    });
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom est obligatoire";
    }

    const initialPrice = parseFloat(formData.initialPrice);
    if (!formData.initialPrice.trim()) {
      newErrors.initialPrice = "Le prix initial est obligatoire";
    } else if (initialPrice <= 0) {
      newErrors.initialPrice = "Le prix initial doit être supérieur à zéro";
    }

    const salePrice = parseFloat(formData.salePrice) || initialPrice;
    if (salePrice < 0) {
      newErrors.salePrice = "Le prix de vente ne peut pas être négatif";
    } else if (salePrice > initialPrice) {
      newErrors.salePrice = "Le prix de vente ne peut pas être supérieur au prix initial";
    }

    const discount = parseFloat(formData.discountPercentage) || 0;
    if (discount < 0 || discount > 100) {
      newErrors.discountPercentage = "Le pourcentage doit être compris entre 0 et 100";
    }

    const stock = parseInt(formData.stock);
    if (!formData.stock.trim()) {
      newErrors.stock = "Le stock est obligatoire";
    } else if (isNaN(stock) || stock < 0) {
      newErrors.stock = "Le stock doit être un nombre positif ou zéro";
    }

    if (!product && !imageFile) {
      newErrors.image = "L'image est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let imageUrl = product?.imageUrl || "";

      // Upload de l'image si nécessaire
      if (imageFile) {
        setUploadProgress(true);
        imageUrl = await productService.uploadImage(imageFile);
        setUploadProgress(false);
      }

      const initialPrice = parseFloat(formData.initialPrice);
      const salePrice = parseFloat(formData.salePrice) || initialPrice;
      const discountPercentage = parseFloat(formData.discountPercentage) || 0;
      const costPrice = parseFloat(formData.costPrice) || 0;

      const productData = {
        name: formData.name,
        description: formData.description,
        initialPrice: roundPrice(initialPrice),
        salePrice: roundPrice(salePrice),
        discountPercentage: roundPercentage(discountPercentage),
        costPrice: roundPrice(costPrice),
        stock: parseInt(formData.stock),
        category: formData.category,
        imageUrl: imageUrl,
        active: formData.active,
      };

      if (product) {
        // Mise à jour
        await productService.updateProduct(product.id, productData);
      } else {
        // Création
        await productService.createProduct(productData);
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      setErrors({ submit: "Une erreur est survenue. Veuillez réessayer." });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(false);
    }
  };

  // Calculer les valeurs pour l'aperçu
  const previewInitialPrice = parseFloat(formData.initialPrice) || 0;
  const previewSalePrice = parseFloat(formData.salePrice) || previewInitialPrice;
  const previewDiscount = parseFloat(formData.discountPercentage) || 0;
  const previewStock = parseInt(formData.stock) || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl mb-6">
        {product ? "Modifier le produit" : "Ajouter un produit"}
      </h3>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm mb-2">
              Nom <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm mb-2">
                Catégorie
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Ex: Électronique"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="stock" className="block text-sm mb-2">
                Stock disponible <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="stock"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                step="1"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  errors.stock ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSubmitting}
              />
              {errors.stock && (
                <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.stock}
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Prix et Promotions
            </h4>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="initialPrice" className="block text-sm mb-2">
                    Prix initial (DT) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="number"
                    id="initialPrice"
                    name="initialPrice"
                    value={formData.initialPrice}
                    onChange={handlePriceChange}
                    step="0.001"
                    min="0"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      errors.initialPrice ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.initialPrice && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.initialPrice}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="costPrice" className="block text-sm mb-2">
                    Prix d'achat / Coût (DT)
                  </label>
                  <input
                    type="number"
                    id="costPrice"
                    name="costPrice"
                    value={formData.costPrice}
                    onChange={handleChange}
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">Pour calculer les bénéfices</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="discountPercentage" className="block text-sm mb-2 flex items-center gap-1">
                    <Percent className="w-4 h-4" />
                    Remise (%)
                  </label>
                  <input
                    type="number"
                    id="discountPercentage"
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handlePriceChange}
                    step="0.01"
                    min="0"
                    max="100"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      errors.discountPercentage ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.discountPercentage && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.discountPercentage}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="salePrice" className="block text-sm mb-2">
                    Prix de vente (DT)
                  </label>
                  <input
                    type="number"
                    id="salePrice"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handlePriceChange}
                    step="0.001"
                    min="0"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                      errors.salePrice ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isSubmitting}
                  />
                  {errors.salePrice && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errors.salePrice}
                    </p>
                  )}
                </div>
              </div>

              {previewDiscount > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="text-sm text-red-600 hover:text-red-700 underline"
                  disabled={isSubmitting}
                >
                  Supprimer la promotion
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Photo {!product && <span className="text-red-600">*</span>}
            </label>
            
            {imagePreview && (
              <div className="relative inline-block mb-4">
                <img
                  src={imagePreview}
                  alt="Aperçu"
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                <span>Sélectionner une image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
              </label>
              {uploadProgress && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Importation...</span>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Formats acceptés : JPG, PNG, WebP (max 5 Mo)
            </p>
            
            {errors.image && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.image}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
              disabled={isSubmitting}
            />
            <label htmlFor="active" className="text-sm cursor-pointer">
              Visible sur le site
            </label>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900">{errors.submit}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadProgress}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>

        {/* Aperçu */}
        <div>
          <h4 className="font-medium mb-4">Aperçu de la carte produit</h4>
          <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg sticky top-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt={formData.name || "Aperçu"}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-4">
              <h3 className="text-xl mb-2">{formData.name || "Nom du produit"}</h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {formData.description || "Description du produit"}
              </p>
              
              <div className="mb-4">
                {previewDiscount > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 line-through text-sm">
                        {formatPrice(previewInitialPrice)}
                      </span>
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                        -{previewDiscount.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-2xl text-blue-600">
                      {formatPrice(previewSalePrice)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl text-blue-600">
                    {formatPrice(previewInitialPrice)}
                  </p>
                )}
              </div>

              <div className="mb-4">
                {previewStock === 0 ? (
                  <span className="inline-block bg-red-100 text-red-800 text-sm px-3 py-1 rounded">
                    Rupture de stock
                  </span>
                ) : previewStock <= 5 ? (
                  <span className="inline-block bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded">
                    Plus que {previewStock} en stock
                  </span>
                ) : (
                  <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded">
                    En stock
                  </span>
                )}
              </div>

              <button
                type="button"
                disabled={previewStock === 0}
                className={`w-full px-4 py-2 rounded-lg transition-colors ${
                  previewStock === 0
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {previewStock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}