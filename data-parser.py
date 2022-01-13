import os

mapeAdapts = []
nomapeAdapts = []

mapeUtils = []
nomapeUtils = []

mapeTimes = []
nomapeTimes = []

mapeViols = []
nomapeViols = []

for root, dirs, files in os.walk("data"):
  for f in files:
    if f.endswith(".txt"):
        with open(os.path.join(root, f)) as ff:
          lines = ff.readlines()
          viols = 0
          if "noMAPE" in f:
            for l in lines:
              if 'TotalNumberOfAdaptations' in l:
                d = l.split(":")
                nomapeAdapts.append(int(d[1]))
              if 'gameOver' in l:
                d = l.split(":")
                nomapeTimes.append(int(d[0]))
              if 'violation' in l:
                viols += 1

            nomapeViols.append(viols)
          else:
            for l in lines:
              if 'gameOver' in l:
                d = l.split(":")
                mapeTimes.append(int(d[0]))
              if 'violation' in l:
                viols += 1
              if 'TotalNumberOfAdaptations' in l:
                d = l.split(":")
                mapeAdapts.append(int(d[1]))

            mapeViols.append(viols)

print(mapeViols)
print(nomapeViols)
print(mapeTimes)
print(nomapeTimes)
print(mapeAdapts)
print(nomapeAdapts)