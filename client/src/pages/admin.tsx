import React, { useEffect, useState } from "react";

import {
  Main,
  Text,
  Heading,
  Box,
  Image,
  Button,
  Layer,
  Form,
  FormField,
  TextArea,
} from "grommet";
import { AddCircle, Close, SubtractCircle, FormEdit } from "grommet-icons";

import Loader from "react-loader-spinner";

import useFetch from "../hooks/useFetch";
import { IProduct } from "../components/product";
import FormFieldLabel from "../components/form-field-label";

const initialInputs: IProduct = {
  title: "",
  image: "",
  price: 0,
  sizes: [
    {
      size: "",
      stock: 0,
    },
  ],
  desc: "",
  category: "",
};

const API_PRODUCTS_URL = "http://localhost:8080/api/products";
const API_IMAGE_URL = "http://localhost:8080/api/files";

const Admin = () => {
  const [collections, setCollections] = useState<IProduct[][]>(null);
  const [inputs, setInputs] = useState(initialInputs);
  const [file, setFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [editOrAdd, setEditOrAdd] = useState<"edit" | "add">("add");
  const [itemToEdit, setItemToEdit] = useState<IProduct>(null);
  const [category, setCategory] = useState(null);
  const [sizes, setSizes] = useState({
    small: 0,
    medium: 0,
    large: 0,
  });

  const { response: products, error, loading } = useFetch(
    API_PRODUCTS_URL,
    {},
    []
  );

  // post selected image and update inputs with imageId
  useEffect(() => {
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    const options: RequestInit = {
      method: "POST",
      credentials: "include",
      body: formData,
    };

    fetch(API_IMAGE_URL, options)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.message === "success") {
          setInputs((prev) => ({ ...prev, image: data.id }));
        }
      })
      .catch(console.log);
  }, [file]);

  // converts fetched products in to collection matrix
  useEffect(() => {
    if (!products) return;

    const collectionsObj = {};

    products.forEach((product: IProduct) => {
      if (!collectionsObj[product.category]) {
        collectionsObj[product.category] = [product];
      } else {
        collectionsObj[product.category] = [
          ...collectionsObj[product.category],
          product,
        ];
      }
    });

    const collectionsMatrix = Object.values(collectionsObj) as [IProduct[]];
    setCollections(collectionsMatrix);
  }, [products]);

  // transforms inputs to an IProduct
  const transformInputsToProduct = () => {
    const transformedSizes = Object.entries(sizes)
      .map((entry) => ({
        size: entry[0],
        stock: entry[1],
      }))
      .filter((sizeObj) => sizeObj.stock !== 0);

    const completeProduct: IProduct = {
      ...inputs,
      category: inputs.category.length ? inputs.category : category,
      sizes: transformedSizes,
    };
    return completeProduct;
  };
  // requests api to add new product to database and adds new product to the collection matrix
  const addToCollection = async () => {
    const product = transformInputsToProduct();

    const options: RequestInit = {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    };

    const res = await fetch(API_PRODUCTS_URL, options);
    const data = await res.json();

    const updatedCollections = collections.map((collection) => {
      if (collection[0].category === data.category) {
        return [...collection, data];
      }
      return collection;
    });
    setCollections(updatedCollections);
    setOpen(false);
    setFile(null);
  };

  //  requests api to edit a product in the database and updated the edited product in the collection matrix
  const editItem = async () => {
    const product = transformInputsToProduct();
    const options: RequestInit = {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    };
    const res = await fetch(API_PRODUCTS_URL + "/" + itemToEdit._id, options);
    const data = await res.json();
    const updatedCollections = collections.map((collection) => {
      if (collection[0].category === data.category) {
        return collection.map((item) =>
          item._id === itemToEdit._id ? product : item
        );
      }
      return collection;
    });
    setCollections(updatedCollections);
    setOpen(false);
    setFile(null);
  };

  //  requests api to remove a product in the database and updates the collection matrix
  const removeFromCollection = (productToRemove: IProduct) => {
    const updatedCollection = collections.map((collection) =>
      collection.filter((product) => product._id !== productToRemove._id)
    );
    setCollections(updatedCollection);
    const options: RequestInit = {
      method: "DELETE",
      credentials: "include",
    };
    fetch(API_PRODUCTS_URL + "/" + productToRemove._id, options)
      .then((res) => res.json)
      .then(console.log);
  };

  const handleInputs = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const validateInputs = 
  inputs.title.length >= 2 &&
  inputs.price > 0 &&
  inputs.category.length >= 1 &&
  (editOrAdd === 'add'? file:true )

  // takes the product data and sets the input state
  const setInputsToItemData = (product: IProduct) => {
    const productCopy = Object.assign({}, product);

    setSizes({
      small: product.sizes.find((el) => el.size === "small")
        ? product.sizes.find((el) => el.size === "small").stock
        : 0,
      medium: product.sizes.find((el) => el.size === "medium")
        ? product.sizes.find((el) => el.size === "medium").stock
        : 0,
      large: product.sizes.find((el) => el.size === "large")
        ? product.sizes.find((el) => el.size === "large").stock
        : 0,
    });
    setInputs(productCopy);
  };

  const closeModal = () => {
    setFile(null);
    setOpen(false);
  };

  return (
    <Main pad={{ horizontal: "2rem" }}>
      <Box
        direction="row"
        justify="center"
        // wrap
        style={{
          minHeight: "unset",
          display: "grid",
          gridTemplateColumns: "repeat( auto-fit, minmax(280px, 1fr))",
          gap: "4rem",
        }}
      >
        {loading ? (
          <Loader
            className="loader"
            type="Oval"
            color="black"
            height={75}
            width={75}
            style={{ display: "grid", placeItems: "center", height: "100%" }}
          />
        ) : (
          !error &&
          collections &&
          collections.map((collection, index) => (
            <Box key={index} width="large" style={{ minHeight: "unset" }}>
              <Heading size="small">
                {collection[0].category}
                <Button
                  icon={
                    <AddCircle
                      onClick={() => {
                        setEditOrAdd("add");
                        setCategory(collection[0].category);
                        setItemToEdit(null);
                        setInputs({
                          ...initialInputs,
                          category: collection[0].category,
                        });
                        setOpen(true);
                      }}
                    />
                  }
                />
              </Heading>

              {!error &&
                products &&
                collection.map((product: IProduct) => (
                  <Box
                    key={product._id}
                    style={{
                      borderBottom: "1px solid gray",
                      padding: "0.5rem 0",
                      minHeight: "100px",
                    }}
                  >
                    <Box
                      direction="row"
                      align="center"
                      alignContent="between"
                      fill="vertical"
                    >
                      <Image
                        src={product.imageURL}
                        style={{ width: "3rem", marginTop: "1rem" }}
                      ></Image>
                      <Text
                        weight="bold"
                        margin={{ left: "small" }}
                        style={{ minWidth: "45%" }}
                      >
                        {product.title}
                      </Text>

                      <Box
                        direction="row"
                        align="center"
                        justify="end"
                        fill="horizontal"
                      >
                        <Button
                          icon={<SubtractCircle />}
                          onClick={() => removeFromCollection(product)}
                          style={{ padding: "0.4rem" }}
                        />
                        <Button
                          icon={<FormEdit />}
                          onClick={() => {
                            setEditOrAdd("edit");
                            setCategory(collection[0].category);
                            setItemToEdit(product);
                            setInputsToItemData(product);
                            setOpen(true);
                          }}
                          style={{ padding: "0.4rem" }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
            </Box>
          ))
        )}

        {open && (
          <Layer
            style={{ overflow: "auto" }}
            position="center"
            onClickOutside={closeModal}
          >
            <Box>
              <Form validate="blur" style={{ overflowY: "scroll" }}>
                <Box
                  background="light-3"
                  width="large"
                  pad="medium"
                  justify="between"
                >
                  <Button
                    alignSelf="end"
                    icon={<Close />}
                    onClick={closeModal}
                  />
                  <Heading size="xsmall">{category}</Heading>

                  <FormFieldLabel
                    name="title"
                    label="Product name"
                    required
                    type="text"
                    value={inputs.title}
                    onChange={handleInputs}
                  />
                  <FormField
                    name="category"
                    label={
                      <Box direction="row">
                        <Text>Category</Text>
                        <Text color="status-critical">*</Text>
                      </Box>
                    }
                    required
                    type="text"
                    value={inputs.category}
                    onChange={handleInputs}
                  />
                  <FormField
                    name="price"
                    label={
                      <Box direction="row">
                        <Text>Price</Text>
                        <Text color="status-critical">*</Text>
                      </Box>
                    }
                    required
                    type="number"
                    min="1"
                    value={inputs.price.toString()}
                    onChange={handleInputs}
                  />
                  {inputs.price <= 0 ? (
                    <p style={{ color: "red" }}>Price can't be 0 or negative</p>
                  ) : null}
                  <Heading level="3">Image{editOrAdd === 'add'? <span style = {{color:'red'}}>*</span> : null} </Heading>
                  <label
                    htmlFor="imageUpload"
                    style={{ width: "4rem", cursor: "pointer" }}
                  >
                    <Image
                      margin={{ bottom: "small" }}
                      src={
                        file
                          ? URL.createObjectURL(file)
                          : itemToEdit
                          ? itemToEdit.imageURL
                          : ""
                      }
                      alt=""
                      style={{ width: "4rem" }}
                    />
                  </label>
                  <input
                    id="imageUpload"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                  <Heading level="3">Sizes</Heading>
                  <Box direction="row" align="center">
                    <Box direction="column">
                      <label className="size-label" htmlFor="small">
                        Small
                      </label>
                      <FormField
                        name="small"
                        placeholder="stock"
                        type="number"
                        min="0"
                        value={sizes.small}
                        onChange={(event) =>
                          setSizes({
                            ...sizes,
                            small: parseInt(event.target.value),
                          })
                        }
                        style={{
                          border: "0.5px solid black",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </Box>
                    <Box direction="column" style={{ margin: "1rem" }}>
                      <label className="size-label" htmlFor="medium">
                        Medium
                      </label>
                      <FormField
                        name="medium"
                        placeholder="stock"
                        type="number"
                        min="0"
                        value={sizes.medium}
                        onChange={(event) =>
                          setSizes({
                            ...sizes,
                            medium: parseInt(event.target.value),
                          })
                        }
                        style={{
                          border: "0.5px solid black",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </Box>
                    <Box direction="column">
                      <label className="size-label" htmlFor="large">
                        Large
                      </label>
                      <FormField
                        name="large"
                        placeholder="stock"
                        type="number"
                        min="0"
                        value={sizes.large}
                        onChange={(event) =>
                          setSizes({
                            ...sizes,
                            large: parseInt(event.target.value),
                          })
                        }
                        style={{
                          border: "0.5px solid black",
                          borderRadius: "0.25rem",
                        }}
                      />
                    </Box>
                  </Box>
                  <Box pad={{ bottom: "medium" }}>
                    <Heading level="3">Description</Heading>
                    <TextArea
                      name="desc"
                      required
                      value={inputs.desc}
                      rows={10}
                      onChange={handleInputs}
                    />
                  </Box>
                  {validateInputs ? null : (
                    <p style={{ alignSelf: "center" }}>
                      Remember to fill all{" "}
                      <span style={{ color: "red" }}>required* </span>fields
                    </p>
                  )}
                  {editOrAdd === "add" ? (
                    <Button
                      primary
                      disabled={validateInputs ? false : true}
                      onClick={() => addToCollection()}
                      label="Add to collection"
                    />
                  ) : (
                    <Button
                      primary
                      disabled={validateInputs ? false : true}
                      onClick={() => editItem()}
                      label="Submit edit"
                    />
                  )}
                </Box>
              </Form>
            </Box>
          </Layer>
        )}
      </Box>
    </Main>
  );
};

export default Admin;
