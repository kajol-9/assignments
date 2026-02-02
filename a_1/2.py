orders = [

["apple", "banana", "apple"],

["banana", "orange"],

["apple", "orange", "orange"]

]

flatten_list = [fruit for a in orders for fruit in a ]

print(flatten_list)

# from itertools import chain

# flatten_list2 = list(chain.from_iterable(orders))
# print(flatten_list2)

quantity_dict = {}
for a in flatten_list:

    if a in quantity_dict:
        quantity_dict[a] += 1
    else:
        quantity_dict[a] = 1

print(quantity_dict)


unique_products = set(flatten_list)

print(unique_products)

most_ordered_count = 0
most_ordered_fruit = None
least_ordered_fruit = None
least_ordered_count =  float('inf')

for fruit,count in quantity_dict.items():

    if count > most_ordered_count :
        most_ordered_count = count
        most_ordered_fruit = fruit

    if count < least_ordered_count:
        least_ordered_fruit = fruit
        least_ordered_count = count

print(f"the most ordered fruit {most_ordered_fruit} and its quantity is {most_ordered_count}")
print(f"the least ordered fruit {least_ordered_fruit} and its quantity is {least_ordered_count}")

print("summary")
for fruit,count in quantity_dict.items():
    print(f"{fruit}:{count}")






  
