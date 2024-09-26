import { h, Fragment } from 'preact';
import { observer } from 'mobx-react';
import { InlineBanner, withController, Facet, Facets } from '@searchspring/snap-preact-components';
import { until } from '../scripts/functions';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import axios from 'axios';

export const Results = withController(
	observer((props) => {
		const controller = props.controller;
		const {
			results,
			pagination: { totalPages },
		} = controller.store;

		return (
			<div className='sortby-grid-group'>
				<div className="grid grid--uniform">
					{results.map((result, i) => (
						<>
							{/* {searchVideoResult(i)} */}
							<div className={`splide__slide  small--one-half medium-up--one-quarter  collection-grid-columns item-${i + 1}`} data-aos="row-of-4" key={result.id}>
								{{
									banner: <InlineBanner banner={result} />,
								}[result.type] || <Result result={result} />}
							</div>
						</>
					))}
				</div>
			</div>
		);
	})
);

export const Result = withController(
	observer((props) => {
		const { result, controller, identity, } = props;
		const {
			attributes,
			mappings: { core },
		} = result;
		const [collectionName, setCollectionName] = useState();
		const [colorsOptionsDataWithMetal, setColorsOptionsDataWithMetal] = useState([]);

		let nf = new Intl.NumberFormat('en-US');
		const facets = controller?.store?.facets;
		const collectionHandle = controller?.context?.collection?.handle;

		const selectedMaterials = facets?.filter((facet) => facet.field === "ss_material" && facet.filtered === true);
		const selectedMaterialsValues = selectedMaterials?.length ? selectedMaterials[0].values.filter((val) => val.filtered) : [];
		const selectedColors = facets?.filter((facet) => facet.label === "Gemstone" && facet.filtered === true);
		const selectedColorsValues = selectedColors?.length ? selectedColors[0].values.filter((val) => val.filtered) : [];

		const intellisuggest = (e) => controller.track.product.click(e, result);
		const StrToJson = attributes.ss_sizes ? JSON.parse(attributes.ss_sizes) : '';
		const sizes = StrToJson ? StrToJson.map((size) => size) : '';
		const ssOptions = JSON.parse(attributes.ss_options);
		const colorsOptions = ssOptions.length ? ssOptions.filter((opt) => opt.option.toLowerCase() === "color" && ((opt.mfield_custom_visible?.length && opt.mfield_custom_visible[0] == "Y") || (opt.values && opt.values[0].mfield_custom_visible?.length && opt.values[0].mfield_custom_visible[0] == "Y"))) : [];
		const metalOptionsData = [];
		if (ssOptions.length) {
			const metalData = ssOptions.filter((opt) => opt.option.toLowerCase() === "metal");
			metalOptionsData.push(...metalData);
			if (metalData.length) {
				const colorsWithMetal = metalData[0].values.filter((opt) => opt.option.toLowerCase() === "color" && ((opt.mfield_custom_visible?.length && opt.mfield_custom_visible[0] == "Y") || (opt.values && opt.values[0].mfield_custom_visible?.length && opt.values[0].mfield_custom_visible[0] == "Y")));
				colorsOptions.push(...colorsWithMetal);
			}
		}

		const sizesOptions = ssOptions.length ? ssOptions.filter((opt) => opt.option.toLowerCase() === "size") : [];
		if (ssOptions.length) {
			const metalData = ssOptions.filter((opt) => opt.option.toLowerCase() === "metal");
			if (metalData.length) {
				const sizeWithMetal = metalData[0].values.filter((opt) => opt.option.toLowerCase() === "size");
				sizesOptions.push(...sizeWithMetal);
			}
		}

		const visibleColorCount = 4;
		const [isQuickView, setIsQuickView] = useState(false);
		const [isColorCount, setIsColorCount] = useState(true);
		const [filteredMetalDetails, setFilteredMetalDetails] = useState(null);
		const [selectedColorData, setSelectedColorData] = useState({ image: attributes.variant_images ? JSON.parse(attributes.variant_images[Object.getOwnPropertySymbols(attributes.variant_images)[0]].values_[0]).img : "", id: "" });

		useEffect(() => {
			setColorsOptionsDataWithMetal(colorsOptions);
		}, [colorsOptions.length]);

		useEffect(() => {
			document.querySelector('body').classList.add('ss-bodylist');

			document.querySelector('.ProductListWrapper .ss__slideout__button')?.addEventListener('click', () => {
				document.querySelector('body').classList.add('openFilter');
			});
			document.querySelector('.facets-close ')?.addEventListener('click', () => {
				document.querySelector('body').classList.remove('openFilter');
			});

			function equalHeight(container) {
				var currentTallest = 0;
				var currentRowStart = 0;
				var rowDivs = [];
				var elements = document.querySelectorAll(container);

				elements.forEach(function (element) {
					var el = element;
					el.style.height = 'auto';
					var topPosition = el.offsetTop;

					if (currentRowStart !== topPosition) {
						rowDivs.forEach(function (rowDiv) {
							rowDiv.style.height = currentTallest + 'px';
						});
						rowDivs = [];
						currentRowStart = topPosition;
						currentTallest = el.offsetHeight;
						rowDivs.push(el);
					} else {
						rowDivs.push(el);
						currentTallest = (currentTallest < el.offsetHeight) ? el.offsetHeight : currentTallest;
					}

					rowDivs.forEach(function (rowDiv) {
						rowDiv.style.height = currentTallest + 'px';
					});
				});
			}

			equalHeight('.ProductList .Grid__Cell .ProductItem__Title');


			window.addEventListener('resize', function () {
				equalHeight('.ProductList .Grid__Cell .ProductItem__Title');

			});

			document.querySelector('button.pdtlist-view-btn')?.addEventListener('click', function () {
				equalHeight('.ProductList .Grid__Cell .ProductItem__Title');
			});
			document.querySelector('button.pdtgrid-view-btn')?.addEventListener('click', function () {
				equalHeight('.ProductList .Grid__Cell .ProductItem__Title');
			});
		}, []);

		useEffect(() => {
			const shopByMetal = metalOptionsData.find(data => collectionHandle?.includes(data.label.toLowerCase().split(" ").join("-")));
			if (!selectedColorData?.id && colorsOptionsDataWithMetal.length && !selectedMaterialsValues.length && !selectedColorsValues.length && !shopByMetal) {
				setSelectedColorData({
					image: colorsOptionsDataWithMetal[0].values?.length ? colorsOptionsDataWithMetal[0].values[0].image : colorsOptionsDataWithMetal[0].image,
					id: colorsOptionsDataWithMetal[0].values?.length ? colorsOptionsDataWithMetal[0].values[0].id : colorsOptionsDataWithMetal[0].id
				});
			}
		}, [colorsOptionsDataWithMetal.length, selectedMaterialsValues.length, selectedColorsValues.length, collectionHandle, metalOptionsData]);

		useEffect(() => {
			function getInfoForSelectedMetals(handle, metalData) {
				const metalInfo = metalData.find(data => handle?.includes(data.label.toLowerCase().split(" ").join("-")) || (handle === "jewelry-metal-18k-yellow-gold" && data.label.toLowerCase() === "18k gold"));

				if (metalInfo) {
					const colorsInfo = metalInfo.values.filter((opt) => opt.option.toLowerCase() === "color" && ((opt.mfield_custom_visible?.length && opt.mfield_custom_visible[0] == "Y") || (opt.values && opt.values[0].mfield_custom_visible?.length && opt.values[0].mfield_custom_visible[0] == "Y")));
					setColorsOptionsDataWithMetal(colorsInfo);
					setFilteredMetalDetails(metalInfo);
					return {
						image: metalInfo.values[0].values?.length ? metalInfo.values[0].values[0].image : metalInfo.values[0].image,
						id: metalInfo.values[0].values?.length ? metalInfo.values[0].values[0].id : metalInfo.values[0].id,
					};
				} else {
					setFilteredMetalDetails(null);
				}
			}

			const productDetails = getInfoForSelectedMetals(collectionHandle, metalOptionsData);
			if (productDetails) {
				setSelectedColorData(productDetails);
			}
		}, [metalOptionsData.length, collectionHandle]);

		useEffect(() => {
			function getInfoForSelectedMetals(selectedMetals, metalData) {

				for (const metal of selectedMetals) {
					const metalInfo = metalData.find(data => data.label.toLowerCase() === metal.label.toLowerCase());

					if (metalInfo) {
						const colorsInfo = metalInfo.values.filter((opt) => opt.option.toLowerCase() === "color" && ((opt.mfield_custom_visible?.length && opt.mfield_custom_visible[0] == "Y") || (opt.values && opt.values[0].mfield_custom_visible?.length && opt.values[0].mfield_custom_visible[0] == "Y")));
						setColorsOptionsDataWithMetal(colorsInfo);
						setFilteredMetalDetails(metalInfo);
						return {
							image: metalInfo.values[0].values?.length ? metalInfo.values[0].values[0].image : metalInfo.values[0].image,
							id: metalInfo.values[0].values?.length ? metalInfo.values[0].values[0].id : metalInfo.values[0].id,
						};
					} else {
						setFilteredMetalDetails(null);
					}
				}
				return null;
			}

			const productDetails = getInfoForSelectedMetals(selectedMaterialsValues, metalOptionsData);
			if (productDetails) {
				setSelectedColorData(productDetails);
			}
		}, [metalOptionsData.length, selectedMaterialsValues.length, setColorsOptionsDataWithMetal, setFilteredMetalDetails, setSelectedColorData]);

		useEffect(() => {
			function getInfoForSelectedColors(selectedColors, colorData) {
				for (const color of selectedColors) {

					const colorInfo = colorData.find(data => data.label.toLowerCase() === color.label.toLowerCase());

					if (colorInfo) {

						return {
							image: colorInfo.values?.length ? colorInfo.values[0].image : colorInfo.image,
							id: colorInfo.values?.length ? colorInfo.values[0].id : colorInfo.id,
							label: colorInfo.label
						};
					}
				}

				return null;
			}

			const productDetails = getInfoForSelectedColors(selectedColorsValues, colorsOptionsDataWithMetal);
			if (productDetails) {
				setSelectedColorData({ image: productDetails.image, id: productDetails.id });
				const sorter = (a, b) => {
					if (a.label.toLowerCase() === productDetails.label.toLowerCase()) {
						return -1;
					}
					if (b.label.toLowerCase() === productDetails.label.toLowerCase()) {
						return 1;
					}
					return a.label.toLowerCase() < b.label.toLowerCase() ? -1 : 1;
				};
				const sortedColorsOptionsDataWithMetal = [...colorsOptionsDataWithMetal].sort(sorter);
				setColorsOptionsDataWithMetal(sortedColorsOptionsDataWithMetal);
			} else if (colorsOptionsDataWithMetal.length) {
				setSelectedColorData({
					image: colorsOptionsDataWithMetal[0].values?.length ? colorsOptionsDataWithMetal[0].values[0].image : colorsOptionsDataWithMetal[0].image,
					id: colorsOptionsDataWithMetal[0].values?.length ? colorsOptionsDataWithMetal[0].values[0].id : colorsOptionsDataWithMetal[0].id
				});
			}
		}, [colorsOptionsDataWithMetal.length, selectedColorsValues.length])

		useEffect(() => {
			const fetchData = async () => {
				const data = JSON.stringify({
					query: `{
  collection(id: "${attributes.mfield_custom_pdp_collection}") {
      title
  }
}`,
				});

				const config = {
					method: 'post',
					url: 'https://ippolitajewelry.myshopify.com/api/2023-01/graphql.json',
					headers: {
						'Content-Type': 'application/json',
						'X-Shopify-Storefront-Access-Token': 'd7381fa059b3c42963a30151238e74fc',
					},
					data: data,
				};

				try {
					const response = await axios(config);
					setCollectionName(response.data.data?.collection?.title);
				} catch (error) {
					console.error('Error fetching data:', error);
				}
			};

			fetchData();
		}, []);

		const handleAddToCart = async (id, isAvailable) => {
			if (!isAvailable) return;
			try {
				await until(() => {
					return (
						classVariantPLPSection &&
						typeof classVariantPLPSection === 'object' &&
						classVariantPLPSection.addtocart &&
						typeof classVariantPLPSection.addtocart === 'function'
					);
				});
				classVariantPLPSection.addtocart(id);
			} catch {
				// Problem adding to cart
			}
		};

		const handleQuickView = () => {
			setIsQuickView(!isQuickView);
		}

		const handleColorSelect = (colorData) => {
			setSelectedColorData({ image: colorData.image, id: colorData.id });
		}

		return (
			result && (
				<>
					<div className="ProductItem ">
						<div className="ProductItem__Wrapper">
							<span className='quick-view-model' onClick={handleQuickView}>Quick View</span>
							<a
								href={core.url + `${selectedColorData?.id ? `?variant=${selectedColorData.id}` : ""}`}
								className="ProductItem__ImageWrapper ProductItem__ImageWrapper--withAlternateImage"
								ss-track-intellisuggest={result.attributes.intellisuggestData}
								ss-track-intellisuggest-signature={result.attributes.intellisuggestSignature}
							>
								<div className="grid__item-image-wrapper">
									<div className="grid-product__image-mask">

										{attributes.tags?.[0] && attributes.tags?.[0] != "evi_showorno" ? <span className='badge-tagline'>{attributes.tags?.[0]}</span> : null}
										<div className="wishlist-engine wishlist-plp" data-product_id={core.uid} data-variant_id={attributes.ss_id} data-full_button="false" data-css="true"></div>
										{attributes.ss_image_hover && <img className="ProductItem__Image ProductItem__Image--alternate" src={attributes.ss_image_hover} alt={core.name} />}
										<img className={attributes.ss_image_hover ? ('ProductItem__Image') : ('ProductItem__Image nopdt-alter-img')} src={selectedColorData?.image ? selectedColorData.image : core.imageUrl || 'https://cdn.shopify.com/s/files/1/0629/9002/4756/files/no-product-image.jpg'} alt={core.name} />
									</div>
								</div>
							</a>
							<ul className="color-options tag-list">
								{colorsOptionsDataWithMetal.length > 1 ? colorsOptionsDataWithMetal.map((opt, index) => {
									const colorValue = opt.label.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(" ", '-');
									return <>{opt.option.toLowerCase() === "color" && (index <= visibleColorCount - 1 || !isColorCount) ?
										<li className={`tag tag--swatch ${opt.values?.length && selectedColorData?.id == opt.values[0]?.id ? "selected" : ""}`}>
											<span onClick={() => handleColorSelect(opt.values?.length ? opt.values[0] : opt)}>
												<label className="tag__checkbox-wrapper text-label">
													<input type="checkbox" className="tag__input" name="filter.v.option.color" value={opt.label} />
													<span
														className={`color-swatch color-swatch--filter color-swatch--${opt.label}`}
														title={opt.label}
														style={`background-image: url(https://cdn.shopify.com/s/files/1/0629/9002/4756/files/${colorValue}.png)`}
													>
														{opt.label}
													</span>
													{/* <span className="tag__text hide">{opt.label}</span> */}
												</label>
											</span>
										</li>
										: null}
									</>
								}) : null}
								{colorsOptionsDataWithMetal.length > visibleColorCount && isColorCount ?
									<li onClick={() => setIsColorCount(!isColorCount)} className='more-count' style={{ display: !isColorCount ? "none" : "" }}>
										+{colorsOptionsDataWithMetal.length - visibleColorCount}
									</li>
									: null}
							</ul>
							<div className="ProductItem__LabelList">
								<span className="ProductItem__Label Heading Text--subdued">{attributes.tags_label}</span>
							</div>
							<div class="fs-collection-wrapper" key={core.name}>{collectionName}</div>
							<div className="ProductItem__Info ProductItem__Info--center ">
								<h2 className="ProductItem__Title Heading">
									<a href={core.url + `${selectedColorData?.id ? `?variant=${selectedColorData.id}` : ""}`}>{core.name}</a>
								</h2>
								<div className="ProductItem__PriceList  Heading">
									<div className="ProductItem__Price Price Text--subdued">
										<span className='ss-price'>${nf.format(core.price)}</span>
										{core.msrp && <span className="msrp-price">${nf.format(core.msrp)}</span>}
									</div>
								</div>
							</div>
						</div>
					</div>
					{isQuickView ? <QuickView productId={result.id} core={core} attributes={attributes} colorsOptions={colorsOptionsDataWithMetal} sizesOptions={sizesOptions} filteredMetalDetails={filteredMetalDetails} handleQuickView={handleQuickView} /> : null}
				</>
			)
		);
	})
);

export const NoResults = withController(
	observer((props) => {
		const controller = props.controller;
		const store = controller.store;
		const dym = store.search.didYouMean;
		const contactEmail = 'contact@thesite.com';

		return (
			<div className="ss__no-results">
				<div className='no_result_found'>No results found.</div>
				<div className="ss__no-results__container">
					{dym && (
						<p className="ss__did-you-mean">
							Did you mean <a href={dym.url.href}>{dym.string}</a>?
						</p>
					)}
				</div>

				<div className="ss__no-results__container">
					<h4 style="margin-bottom: 5px;">Suggestions</h4>

					<ul className="ss__no-results__suggestions">
						<li>Check for misspellings.</li>
						<li>Remove possible redundant keywords (ie. "products").</li>
						<li>Use other words to describe what you are searching for.</li>
					</ul>

					<p>
						Still can't find what you're looking for?{' '}
						<a href="/contact-us/" style="font-size: 14px;">
							Contact us
						</a>
						.
					</p>

					<hr />

					<div className="ss__no-results__container">
						<div className="ss__no-results__contact">
							<div className="ss__no-results__contact__phone">
								<h4 style="margin-bottom: 5px;">Call Us</h4>
								<p>555-555-5555</p>
							</div>

							<div className="ss__no-results__contact__email">
								<h4 style="margin-bottom: 5px;">Email Us</h4>
								<p>
									<a href={`mailto:${contactEmail}`} style="font-size: 14px;">
										{contactEmail}
									</a>
								</p>
							</div>

							<div className="ss__no-results__contact__location">
								<h4 style="margin-bottom: 5px;">Physical Address</h4>
								<p>
									123 Street Address
									<br />
									City, State, Zipcode
								</p>
							</div>

							<div className="ss__no-results__contact__hours">
								<h4 style="margin-bottom: 5px;">Hours</h4>
								<p>Monday - Friday: 8am - 9pm MDT</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	})
);

export const QuickView = (({ productId, core, attributes, colorsOptions, sizesOptions, filteredMetalDetails, handleQuickView }) => {
	const variantSizes = attributes.variant_size ? attributes.variant_size[Object.getOwnPropertySymbols(attributes.variant_size)[0]].values_ : [];
	const [selectedSize, setSelectedSize] = useState(null);
	const [selectedColor, setSelectedColor] = useState(null);
	const [selectedMetal, setSelectedMetal] = useState(null);
	const [selectedQuantity, setSelectedQuantity] = useState(1);
	const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
	const [isMetalDropdownOpen, setIsMetalDropdownOpen] = useState(false);
	const [isShowMore, setIsShowMore] = useState(null);
	const [colorsOptionsData, setColorsOptionsData] = useState(colorsOptions);
	const [sizesOptionsData, setSizesOptionsData] = useState(sizesOptions);
	const [metalOptions, setMetalOptions] = useState([]);
	const descriptionRef = useRef(null);
	const [coreData, setCoreData] = useState({ url: core.url, imageUrl: core.imageUrl, price: core.price, msrp: core.msrp, sku: core.sku, description: attributes.variant_mfield_custom_pdp_description });
	let nf = new Intl.NumberFormat('en-US');
	const ssOptions = JSON.parse(attributes.ss_options);

	const handleSelectSize = (event, sizesData) => {
		const selectedSizeData = sizesData.find((data) => data.id == event.target.value)
		setSelectedSize(selectedSizeData);
		setCoreData({ url: selectedSizeData.url, imageUrl: selectedSizeData.image, price: selectedSizeData.price, msrp: selectedSizeData.msrp, sku: coreData.sku, description: selectedSizeData.mfield_custom_pdp_description });
		let qtyNotStockElement = document.querySelector('.qty_not_stock');
		if (qtyNotStockElement) {
			qtyNotStockElement.classList.remove('qtyNotStock');
		}
	}

	const handleSelectQuantity = (value) => {
		if (selectedQuantity + value > 0)
			setSelectedQuantity(selectedQuantity + value);
	}

	const handleSelectColor = (colorDetails) => {
		setSelectedColor(colorDetails);
		setIsColorDropdownOpen(false);
		const sizesArr = colorDetails.values?.filter((data) => data.option.toLowerCase() === "size");
		if (sizesArr?.length) {
			setSelectedSize(sizesArr[0]);
			setCoreData({ url: sizesArr[0].url, imageUrl: sizesArr[0].image, price: sizesArr[0].price, msrp: sizesArr[0].msrp, sku: sizesArr[0].sku, description: sizesArr[0].mfield_custom_pdp_description });
		} else if (colorDetails.image) {
			setCoreData({ url: colorDetails.url, imageUrl: colorDetails.image, price: colorDetails.price, msrp: colorDetails.msrp, sku: colorDetails.sku, description: colorDetails.mfield_custom_pdp_description });
		}
		let qtyNotStockElement = document.querySelector('.qty_not_stock');
		if (qtyNotStockElement) {
			qtyNotStockElement.classList.remove('qtyNotStock');
		}
	}

	const handleSelectMetal = useCallback((MetalDetails, type) => {
		setSelectedMetal(MetalDetails);
		setIsMetalDropdownOpen(false);
		const colorsWithMetal = MetalDetails.values.filter((opt) => opt.option.toLowerCase() === "color");
		const sizesWithMetal = MetalDetails.values.filter((opt) => opt.option.toLowerCase() === "size");
		if (colorsWithMetal.length) {
			if (type !== "filteredMetal") {
				setColorsOptionsData([...colorsWithMetal]);
				handleSelectColor(colorsWithMetal[0]);
			}
		} else if (sizesWithMetal.length) {
			setSizesOptionsData([...sizesWithMetal]);
			setSelectedSize(sizesWithMetal[0]);
			setCoreData({ url: sizesWithMetal[0].url, imageUrl: sizesWithMetal[0].image, price: sizesWithMetal[0].price, msrp: sizesWithMetal[0].msrp, sku: coreData.sku, description: sizesWithMetal[0].mfield_custom_pdp_description });
		}
		let qtyNotStockElement = document.querySelector('.qty_not_stock');
		if (qtyNotStockElement) {
			qtyNotStockElement.classList.remove('qtyNotStock');
		}
	}, [setSelectedMetal, setIsMetalDropdownOpen, handleSelectColor, setColorsOptionsData, setSizesOptionsData, setSelectedSize, setCoreData, coreData.sku]);

	useEffect(() => {
		if (ssOptions.length) {
			const metalData = ssOptions.filter((opt) => opt.option.toLowerCase() === "metal");
			setMetalOptions(metalData);
			if (!selectedMetal && filteredMetalDetails) {
				setSelectedMetal(filteredMetalDetails);
				handleSelectMetal(filteredMetalDetails, "filteredMetal");
			} else {
				!selectedMetal && setSelectedMetal(metalData[0]);
			}
		}
	}, [ssOptions, filteredMetalDetails, selectedMetal])

	useEffect(() => {
		if (descriptionRef.current?.innerText?.length > 150) {
			setIsShowMore(true);
		}
	}, [descriptionRef]);

	useEffect(() => {
		if (colorsOptionsData.length) {
			let colorsOptionsDetails = [...colorsOptionsData];
			const availableColors = colorsOptionsDetails.filter((data) => data.option.toLowerCase() === "color" && ((data.mfield_custom_visible?.length && data.mfield_custom_visible[0] == "Y") || (data.values && data.values[0].mfield_custom_visible?.length && data.values[0].mfield_custom_visible[0] == "Y")))
			if (availableColors.length) {
				setSelectedColor(availableColors[0]);
			} else {
				setSelectedColor(null);
			}
		}
	}, [colorsOptionsData, setSelectedColor])

	useEffect(() => {
		if (selectedColor && selectedColor.values?.length) {
			const sizesArr = selectedColor.values.filter((data) => data.option.toLowerCase() === "size");
			if (sizesArr.length) {
				setSelectedSize(sizesArr[0]);
				setCoreData({ url: sizesArr[0].url, imageUrl: sizesArr[0].image, price: sizesArr[0].price, msrp: sizesArr[0].msrp, sku: sizesArr[0].sku, description: sizesArr[0].mfield_custom_pdp_description });
			} else {
				setSelectedSize(null);
			}
		} else if (sizesOptionsData.length) {
			const availableSizes = sizesOptionsData.filter((data) => data.option.toLowerCase() === "size")
			setSelectedSize(availableSizes[0]);
			setCoreData({ url: availableSizes[0].url, imageUrl: availableSizes[0].image, price: availableSizes[0].price, msrp: availableSizes[0].msrp, sku: coreData.sku, description: availableSizes[0].mfield_custom_pdp_description });
		} else {
			setSelectedSize(null);
		}
	}, [selectedColor, sizesOptionsData]);

	const handleAddToCart = async (id, isAvailable) => {
		if (!isAvailable) return;

		try {
			await until(() => {
				return (
					classVariantPLPSection &&
					typeof classVariantPLPSection === 'object' &&
					classVariantPLPSection.addtocart &&
					typeof classVariantPLPSection.addtocart === 'function'
				);
			});
			classVariantPLPSection.addtocart(id);
		} catch {
			// Problem adding to cart
		}
	};

	const handleOnClickAddToCart = (ssProductId, ssVariantId) => {
		document.querySelector('.producttemplate-addtocart').setAttribute('id', `ProductSection-${ssProductId}`);
		document.querySelector('.producttemplate-addtocart').setAttribute('data-section-id', `${ssProductId}`);
		document.querySelector('.producttemplate-addtocart .variant-id').setAttribute('value', `${ssVariantId}`);
		setTimeout(() => {
			document.querySelector('.producttemplate-addtocart .addtocart-submit').click();
		}, 1100);
	}

	useEffect(() => {
		document.querySelector('.quick-view-modal .quick-view .button-wrapper').addEventListener('click', (event) => {
			const ssProductId = productId;
			const ssVariantId = selectedSize ? selectedSize.id : selectedColor?.id;

			document.querySelector('.product-section').setAttribute('data-product-id', ssProductId)
			document.querySelector('.product-section .input-product-id').setAttribute('value', ssProductId)
			document.querySelector('.product-section .product-single__variants option').setAttribute('value', ssVariantId)
			setTimeout(() => {
				document.querySelector('.product-section .add-to-cart').click();
			}, 400)
		});
	}, [productId, selectedSize, selectedColor, selectedSize?.id, selectedColor?.id])

	return (
		<>
			<span className='quickview-overlay'></span>
			<div className="quick-view-modal fs-modal  fs-result-page-o9x1fd" style="">
				<div className="close fs-result-page-o9x1fd">
					<svg onClick={handleQuickView} width="15px" height="15px" fill="white" color="white" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="times" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512">
						<path fill="currentColor" d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"></path>
					</svg>
				</div>
				<div className="modal-children fs-result-page-o9x1fd">
					<div className="quick-view-dialog-wrapper fs-result-page-usndq1">
						<div className="quick-view-dialog-image fs-result-page-usndq1">
							<a href={coreData.url?.split("//ippolita.com/").pop()} className="quick-view-dialog-image fs-result-page-usndq1">
								<img src={coreData.imageUrl || core.imageUrl} alt="quick-view-product" className="quick-view-image fs-result-page-usndq1" fetchpriority="high" />
							</a>
						</div>
						<div className="quick-view-dialog-content fs-result-page-usndq1">
							<div className="fs-result-page-usndq1">
								<a href={coreData.url?.split("//ippolita.com/").pop()} className="fs-result-page-usndq1">
									<div className="quick-view-dialog-title fs-result-page-usndq1">{core.name}</div>
								</a>
								<div className="quick-view-price-wrapper fs-result-page-usndq1">
									<div className="quick-view-dialog-price fs-result-page-usndq1">
										<span className='ss-price'>${nf.format(Math.trunc(coreData.price))}</span>
										{coreData.msrp && <span className="msrp-price">${nf.format(Math.trunc(coreData.msrp))}</span>}
									</div>
								</div>
								<div className="quick-view-dialog-info-header fs-result-page-usndq1">
									<span className="fs-style">Style: <span className="style">#{coreData.sku || attributes.variant_mfield_custom_style_number}</span></span>
									<span className="availability fs-result-page-ymzvtb">Availability:
										<span className="fs-result-page-ymzvtb in-stock" style="color: rgb(0, 0, 0);">{Number(attributes.ss_instock_pct) > 0 ? "In Stock" : "Not In Stock"}</span>
									</span>
								</div>
								<div className="quick-view-dialog-desc fs-result-page-usndq1">
									<span ref={descriptionRef} className={`fs-quick-view-product-html-description-list fs-result-page-usndq1 ${!isShowMore ? "show-less" : "show-more"}`}
										dangerouslySetInnerHTML={{ __html: coreData.description }} />
									{descriptionRef.current?.innerText?.length > 150 ?
										<span className='show-description-span' onClick={() => setIsShowMore(!isShowMore)}>{isShowMore ? "Show More" : "Show Less"}</span>
										: null}
								</div>
								{metalOptions.length ? <div class="variant-wrapper variant-wrapper--dropdown js" data-type="dropdown">
									<label class="variant__label" for="SingleOptionSelector-template--17125022498868__main-7460126621748-option-1">
										METAL
									</label>
									<div class="variant-input-wrap" data-index="option2" data-handle="metal">
										<span class="variant-tittle">
											METAL:
										</span>
										<div class="custom-slt">
											<div class={`select ${isMetalDropdownOpen ? "metal-dropdown-open" : ""}`} onClick={() => setIsMetalDropdownOpen(!isMetalDropdownOpen)}>
												<div class="image-swatches">
													<span id="chooseoption" data-color={selectedMetal?.label}>{selectedMetal?.label}</span>
												</div>
											</div>
											<div class="swatches-main option-container">
												{metalOptions.length > 1 ? metalOptions.map((opt, index) => {
													return <>
														<div class={`image-swatches option ${selectedMetal?.label === opt.label ? "metal-selected" : ""}`} onClick={() => handleSelectMetal(opt)}>
															<span class="swatch-value" data-color={opt.label}>{opt.label}</span>
														</div>
													</>
												}) : null}
											</div>
										</div>
									</div>
								</div> : null}
								{selectedColor && colorsOptionsData.length ? <div class="variant-wrapper variant-wrapper--dropdown js" data-type="dropdown">
									<label class="variant__label" for="SingleOptionSelector-template--17125022498868__main-7460126621748-option-1">
										COLOR
									</label>
									<div class="variant-input-wrap" data-index="option2" data-handle="color">
										<span class="variant-tittle">
											COLOR:
										</span>
										<div class="custom-slt">
											<div class={`select ${isColorDropdownOpen ? "color-dropdown-open" : ""}`} onClick={() => setIsColorDropdownOpen(!isColorDropdownOpen)}>
												<div class="image-swatches">
													<span
														className={`color-swatch color-swatch--filter color-swatch--${selectedColor?.label}`}
														title={selectedColor?.label}
														style={`background-image: url(https://cdn.shopify.com/s/files/1/0629/9002/4756/files/${selectedColor?.label?.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(" ", '-')}.png)`}
													>
														{selectedColor?.label}
													</span>
													<span id="chooseoption" data-color={selectedColor?.label}>{selectedColor?.label}</span>
												</div>
											</div>
											<div class="swatches-main option-container">
												{colorsOptionsData.map((opt, index) => {
													const colorValue = opt.label.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '-').replace(" ", '-');
													return <>
														{((opt.mfield_custom_visible?.length && opt.mfield_custom_visible[0] == "Y") || (opt.values && opt.values[0].mfield_custom_visible?.length && opt.values[0].mfield_custom_visible[0] == "Y")) ? <div title={opt.image || opt.values[0].image} class={`image-swatches option ${selectedColor?.label === opt.label ? "color-selected" : ""}`} onClick={() => handleSelectColor(opt)}>
															<span
																className={`color-swatch color-swatch--filter color-swatch--${opt.label}`}
																title={opt.label}
																style={`background-image: url(https://cdn.shopify.com/s/files/1/0629/9002/4756/files/${colorValue}.png)`}
															>
																{opt.label}
															</span>
															<span class="swatch-value" data-color={opt.label}>{opt.label}</span>
														</div> : null}
													</>
												})}
											</div>
										</div>
									</div>
								</div> : null}
								{
									selectedSize?.label != "ONE SIZE" && selectedColor && selectedColor.values?.length && selectedColor.values.find((data) => data.option.toLowerCase() === "size")
										? <div class="variant-wrapper variant-wrapper--dropdown js" data-type="dropdown">
											<label class="variant__label" for="SingleOptionSelector-template--17125022498868__main-7460126621748-option-2">
												SIZE
											</label>
											<div class={`variant-input-wrap ${selectedColor.values.filter((data) => data.option.toLowerCase() === "size").length === 1 ? "only-one-size" : ""}`} data-index="option3" data-handle="size">
												<span class="variant-tittle">
													SIZE:
												</span>
												<select form="AddToCartForm-template--17125022498868__main-7460126621748" data-variant-input="" onChange={(event) => handleSelectSize(event, selectedColor.values.filter((data) => data.option.toLowerCase() === "size"))} id="SingleOptionSelector-template--17125022498868__main-7460126621748-option-2" data-index="option3">
													{selectedColor.values.filter((data) => data.option.toLowerCase() === "size").map((size) => {
														return <option value={size.id} selected={selectedSize?.label === size.label} name="SIZE" class={`variant-input ${selectedSize?.label === size.label ? "size-selected" : ""}`} data-index="option1">
															{size.label}
														</option>
													})}
												</select>
											</div>
										</div>
										: null
								}
								{
									!selectedColor && sizesOptionsData.length && selectedSize?.label != "ONE SIZE"
										? <div class="variant-wrapper variant-wrapper--dropdown js" data-type="dropdown">
											<label class="variant__label" for="SingleOptionSelector-template--17125022498868__main-7460126621748-option-2">
												SIZE
											</label>
											<div class={`variant-input-wrap ${sizesOptionsData.length === 1 ? "only-one-size" : ""}`} data-index="option3" data-handle="size">
												<span class="variant-tittle">
													SIZE:
												</span>
												<select form="AddToCartForm-template--17125022498868__main-7460126621748" data-variant-input="" onChange={(event) => handleSelectSize(event, sizesOptionsData)} id="SingleOptionSelector-template--17125022498868__main-7460126621748-option-2" data-index="option3">
													{sizesOptionsData.map((size) => {
														return <option value={size.id} selected={selectedSize?.label === size.label} name="SIZE" class={`variant-input ${selectedSize?.label === size.label ? "size-selected" : ""}`} data-index="option1">
															{size.label}
														</option>
													})}
												</select>
											</div>
										</div>
										: null
								}
								{/* <a className="quick-view-dialog-go-to-product-page fs-result-page-usndq1" href="/mini-drop-earrings-in-18k-gold-ge209bt" style="color: rgb(0, 0, 0);">View full details</a> */}
								{/* <div className="selectors-wrapper">
									<div className="selector fs-result-page-6jxlk4">
										<header className="selector-title fs-result-page-6jxlk4">Size</header>
										<div className="options fs-result-page-6jxlk4">
											{sizesOptions.length ? sizesOptions.map((size) => <div onClick={() => handleSelectSize(size)} className={`option fs-result-page-6jxlk4 ${selectedSize === size ? "selected" : ""}`}>{size}</div>) : null}
										</div>
									</div>
								</div> */}
							</div>
							<div className="fs-result-page-usndq1">
								<div className="items fs-result-page-1vf7p7c">
									<div className="quantity-wrapper fs-result-page-kcmzyq">
										<label for="quick-view-qty" className="fs-result-page-kcmzyq">Qty</label>
										<input type="number" name="qty" id="quick-view-qty" value={selectedQuantity} className="isp_add_to_cart_quantity_num fs-result-page-kcmzyq" min="1" max="" autocomplete="off" />
										<div className="buttons fs-result-page-kcmzyq">
											<button onClick={() => handleSelectQuantity(+1)} className="button increase fs-result-page-kcmzyq">
												<svg width="10px" height="10px" style="color:black" aria-hidden="true" focusable="false" data-icon="chevron-up" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
													<path fill="currentColor" d="M240.971 130.524l194.343 194.343c9.373 9.373 9.373 24.569 0 33.941l-22.667 22.667c-9.357 9.357-24.522 9.375-33.901.04L224 227.495 69.255 381.516c-9.379 9.335-24.544 9.317-33.901-.04l-22.667-22.667c-9.373-9.373-9.373-24.569 0-33.941L207.03 130.525c9.372-9.373 24.568-9.373 33.941-.001z"></path>
												</svg>
											</button>
											<button onClick={() => handleSelectQuantity(-1)} className="button decrease fs-result-page-kcmzyq">
												<svg width="10px" height="10px" aria-hidden="true" focusable="false" className="arrow fs-result-page-1n41ehv" style="color:black" data-prefix="fas" data-icon="chevron-down" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
													<path fill="currentColor" d="M207.029 381.476L12.686 187.132c-9.373-9.373-9.373-24.569 0-33.941l22.667-22.667c9.357-9.357 24.522-9.375 33.901-.04L224 284.505l154.745-154.021c9.379-9.335 24.544-9.317 33.901.04l22.667 22.667c9.373 9.373 9.373 24.569 0 33.941L240.971 381.476c-9.373 9.372-24.569 9.372-33.942 0z"></path>
												</svg>
											</button>
										</div>
									</div>
									<div className='qty_not_stock' style={{ display: 'none' }}>Product quantity not in stock.</div>
									<div className='qty_count' style={{ display: 'none' }}>{selectedSize ? selectedSize.available : selectedColor?.total_qty}</div>
									<div className={`fs-result-page-1eis2jl quick-view ${!selectedSize?.available && !selectedColor?.total_qty ? "sold_out_btn" : ""}`}>
										<div className='quick-view-group-btns'>
											<div ss-product-id={productId} ss-variant-id={selectedSize ? selectedSize.id : selectedColor?.id} className="button-wrapper fs-result-page-1eis2jl fs-quick-view-button-wrapper" style="--add-to-cart-font-weight:500;--add-to-cart-text-align:left;--add-to-cart-font-family:Helvetica;--add-to-cart-font-size:14px;--add-to-cart-letter-spacing:0.25px;--add-to-cart-line-height:auto;--add-to-cart-color:#ffffff;--add-to-cart-background:#000001;--add-to-cart-border:unset;--add-to-cart-opacity:1;--add-to-cart-hover-background:#000001;--add-to-cart-hover-text-color:#ffffff;--add-to-cart-border-radius:0px">
												<button onClick={() => handleOnClickAddToCart(productId, selectedSize ? selectedSize.id : selectedColor?.id)} className="add-to-cart-button fs-add-to-cart-button ajax_add_to_cart fs-result-page-1eis2jl quick-view-add-to-cart-radius" >
													<span className="add-to-cart-spinner-text-wrapper fs-result-page-wsvknh">
														<span>ADD TO CART</span>
													</span>
												</button>
											</div>
											<div ss-product-id={productId} ss-variant-id={selectedSize ? selectedSize.id : selectedColor?.id} className="button-wrapper fs-result-page-1eis2jl fs-quick-view-button-wrapper" style="--add-to-cart-font-weight:500;--add-to-cart-text-align:left;--add-to-cart-font-family:Helvetica;--add-to-cart-font-size:14px;--add-to-cart-letter-spacing:0.25px;--add-to-cart-line-height:auto;--add-to-cart-color:#ffffff;--add-to-cart-background:#000001;--add-to-cart-border:unset;--add-to-cart-opacity:1;--add-to-cart-hover-background:#000001;--add-to-cart-hover-text-color:#ffffff;--add-to-cart-border-radius:0px">
												<a class="klaviyo-bis-trigger join-to-waitlist" style="display: block;" href="#">
													<span>JOIN THE WAITLIST</span>
												</a>
											</div>
										</div>
										<div className="wishlist-engine wishlist-plp" data-product_id={productId} data-variant_id={attributes.ss_id} data-full_button="false" data-css="true"></div>
									</div>
									<div className='view-full-details'><a href={coreData.url?.split("//ippolita.com/").pop() + `?variant=${selectedSize ? selectedSize.id : selectedColor?.id}`}>View Full Details</a></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
);