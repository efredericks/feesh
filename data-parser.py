import os
import seaborn as sns
import pandas as pd
from scipy.stats import mannwhitneyu#ttest_ind  # wilcoxon?

mapeAdapts = []
nomapeAdapts = []

mapeUtils = []
nomapeUtils = []

mapeTimes = []
nomapeTimes = []

mapeViols = []
nomapeViols = []

mapeGoalF = []
nomapeGoalF = []

for root, dirs, files in os.walk("data"):
  for f in files:
    if f.endswith(".txt"):
        with open(os.path.join(root, f)) as ff:
          fvals = []
          lines = ff.readlines()
          viols = 0
          if "noMAPE" in f:
            for l in lines:
              if 'frameRate' in l:
                line = l.split(",")
                fval = line[6]
                val = fval.split(":")
                fvals.append(float(val[1]))
                # mapeGoalD.append(float(val[1]))

              if 'TotalNumberOfAdaptations' in l:
                d = l.split(":")
                nomapeAdapts.append(int(d[1]))
              if 'gameOver' in l:
                d = l.split(":")
                nomapeTimes.append(int(d[0]))
              if 'violation' in l:
                viols += 1

            nomapeViols.append(viols)
            nomapeGoalF.append(sum(fvals)/len(fvals))
          else:
            for l in lines:
              if 'frameRate' in l:
                line = l.split(",")
                fval = line[6]
                val = fval.split(":")
                fvals.append(float(val[1]))

              if 'gameOver' in l:
                d = l.split(":")
                mapeTimes.append(int(d[0]))
              if 'violation' in l:
                viols += 1
              if 'TotalNumberOfAdaptations' in l:
                d = l.split(":")
                mapeAdapts.append(int(d[1]))

            mapeViols.append(viols)
            mapeGoalF.append(sum(fvals)/len(fvals))

        # print(dvals)

print(mapeGoalF)
print(nomapeGoalF)
print(mapeViols)
print(nomapeViols)
print(mapeTimes)
print(nomapeTimes)
print(mapeAdapts)
print(nomapeAdapts)


print("TIMES")
sns.color_palette("colorblind")
pdt = pd.DataFrame([mapeTimes, nomapeTimes])
pdt = pdt.transpose()
pdt.columns = ['MAPE-K', 'Normal']
print(pdt.head())
b = sns.boxplot(data=pdt)#, x="Experiment", y="Execution Time")
b.set(ylabel="Execution Time")
b = b.get_figure()
b.savefig("time-plot.png")


g1 = pdt['MAPE-K']
g2 = pdt['Normal']
print(mannwhitneyu(g1,g2))

# print("")
# print("UTIL F")
# pdt2 = pd.DataFrame([mapeGoalF, nomapeGoalF])
# pdt2 = pdt2.transpose()
# pdt2.columns = ['MAPE-K', 'Normal']
# print(pdt2.head())
# c = sns.boxplot(data=pdt2)#, x="Experiment", y="Execution Time")
# c.set(ylabel="Averate Utility Value")
# c = c.get_figure()
# c.savefig("F-plot.png")


# g1 = pdt2['MAPE-K']
# g2 = pdt2['Normal']
# print(mannwhitneyu(g1,g2))